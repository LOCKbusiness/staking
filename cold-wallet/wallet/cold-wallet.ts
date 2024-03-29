import { Network } from '@defichain/jellyfish-network';
import { JellyfishWallet, WalletHdNode } from '@defichain/jellyfish-wallet';
import { WhaleWalletAccount, WhaleWalletAccountProvider } from '@defichain/whale-api-wallet';
import { WhaleApiClient } from '@defichain/whale-api-client';
import { Bip32Options, MnemonicHdNodeProvider } from '@defichain/jellyfish-wallet-mnemonic';
import { CTransactionSegWit, Vout, toOPCodes } from '@defichain/jellyfish-transaction';
import { Logger } from '../../shared/logger';
import { SignedTxPayload, SignMessagePayload, SignedMessagePayload } from '../../shared/communication/dto/operation';
import { BigNumber } from '@defichain/jellyfish-api-core';
import { SmartBuffer } from 'smart-buffer';
import Config from '../../shared/config';
import { Validator } from '../transaction/validator';
import { CheckSignature, Crypto } from '../crypto/crypto';
import { RawTxDto } from '../../shared/dto/raw-tx.dto';
import { signAsync } from 'bitcoinjs-message';
import { PreFilter } from '../transaction/pre-filter';
import { VaultReader } from '../vaults/vault-reader';

interface OwnerAddress {
  wallet: string;
  index: number;
  address: string;
}

export class ColdWallet {
  private readonly seed: string[];
  private readonly network: Network;
  private readonly logger: Logger;

  private wallet?: JellyfishWallet<WhaleWalletAccount, WalletHdNode>;
  private listOfVaults: string[];
  private listOfAddresses: string[];

  constructor(seed: string[], network: Network) {
    this.seed = seed;
    this.network = network;
    this.logger = new Logger('Cold Wallet');
    this.listOfVaults = VaultReader.read();
    this.listOfAddresses = [];
  }

  public async initialize(): Promise<void> {
    if (!this.checkPrerequisites()) throw new Error('Seed is invalid');
    this.wallet = new JellyfishWallet(
      MnemonicHdNodeProvider.fromWords(this.seed, this.bip32OptionsBasedOn(this.network)),
      new WhaleWalletAccountProvider(undefined as unknown as WhaleApiClient, this.network),
      JellyfishWallet.COIN_TYPE_DFI,
      JellyfishWallet.PURPOSE_LIGHT_MASTERNODE,
    );
    this.listOfAddresses = await this.getAddresses(0, Config.wallet.numberOfAddresses).then((addresses) =>
      addresses.map((ownerAddress) => ownerAddress.address),
    );
  }

  public async getName(): Promise<string> {
    return Config.wallet.name;
  }

  public async getAddress(index = 0): Promise<string> {
    if (!this.wallet) throw new Error('Wallet is not initialized');
    return this.wallet.get(index).getAddress();
  }

  public async getAddresses(index: number, count: number): Promise<OwnerAddress[]> {
    const walletName = await this.getName();
    const addresses: OwnerAddress[] = [];

    for (let i = index; i < count; i++) {
      const address = await this.getAddress(i);
      addresses.push({ wallet: walletName, index: i, address: address });
    }

    return addresses;
  }

  public async signTx(data: RawTxDto): Promise<SignedTxPayload> {
    if (!this.wallet) throw new Error('Wallet is not initialized');

    const tx = this.parseTx(data.rawTx.hex);
    const { isIncoming, isAllowed, defiTxType } = PreFilter.check(tx.vout, this.listOfVaults, this.listOfAddresses);
    if (!isAllowed) {
      this.logger.warning(
        `TX failed pre filter checks: ${isIncoming ? 'incoming' : 'outgoing'} ${defiTxType ?? 'UTXO'}`,
      );
      return { isError: true, signedTx: '' };
    }
    this.logger.info(`pre filter check done TX is ${isIncoming ? 'incoming' : 'outgoing'} ${defiTxType ?? 'UTXO'}`);

    const check: Partial<CheckSignature> = {
      message: data.rawTx.hex,
    };

    const issuerValid = Crypto.verifySignature({
      signature: data.issuerSignature,
      address: Config.signature.api,
      ...check,
    });
    const verifierValid = Crypto.verifySignature({
      signature: data.verifierSignature,
      address: Config.signature.transactionChecker,
      ...check,
    });
    const isSignatureValid = isIncoming ? issuerValid || verifierValid : issuerValid && verifierValid;

    if (!isSignatureValid) {
      this.logger.warning('TX failed signature check');
      return { isError: true, signedTx: '' };
    }
    this.logger.info('signature verification passed');

    const accountIndex = data.payload?.accountIndex ?? 0;
    if (accountIndex < 0) return { isError: true, signedTx: '' };
    this.logger.info(`using account index ${accountIndex}`);
    const account = this.wallet.get(accountIndex);

    if (!Validator.isAllowed(tx, await account.getScript(), await this.wallet.get(0).getScript(), defiTxType)) {
      this.logger.warning(`TX failed validation for ${defiTxType}`, data.id);
      return { isError: true, signedTx: '' };
    }
    this.logger.info('validation passed');

    this.logger.info('signing TX');
    this.logger.info(' with', await account.getAddress());
    const prevouts: Vout[] = data.rawTx.prevouts.map((p) => {
      return {
        // needs to be recreated as those are objects and not just data
        value: new BigNumber(p.value),
        script: {
          stack: toOPCodes(SmartBuffer.fromBuffer(Buffer.from(data.rawTx.scriptHex, 'hex'))),
        },
        tokenId: p.tokenId,
      };
    });
    try {
      const signedTx = await account.signTx(tx, prevouts);
      this.logger.info('signed TX');
      return { isError: false, signedTx: new CTransactionSegWit(signedTx).toHex() };
    } catch (e) {
      this.logger.error(`error while signing TX:`, e);
      return { isError: true, signedTx: '' };
    }
  }

  public async signMessage(data: SignMessagePayload): Promise<SignedMessagePayload> {
    if (!this.wallet) throw new Error('Wallet is not initialized');

    if (!Validator.isMessageAllowed(data.message) || data.accountIndex < 0) return { isError: true, signedMessage: '' };

    const account = await this.wallet.get(data.accountIndex);
    const signedMessage = await signAsync(data.message, await account.privateKey(), true, this.network.messagePrefix);
    return { isError: false, signedMessage: signedMessage.toString('base64') };
  }

  private parseTx(hex: string): CTransactionSegWit {
    this.logger.info('parsing TX');
    return new CTransactionSegWit(SmartBuffer.fromBuffer(Buffer.from(hex, 'hex')));
  }

  private bip32OptionsBasedOn(network: Network): Bip32Options {
    return {
      bip32: {
        public: network.bip32.publicPrefix,
        private: network.bip32.privatePrefix,
      },
      wif: network.wifPrefix,
    };
  }

  private checkPrerequisites(): boolean {
    return this.seed != null && this.seed.length === Config.wallet.seed.length;
  }
}
