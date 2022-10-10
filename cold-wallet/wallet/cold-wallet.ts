import { Network } from '@defichain/jellyfish-network';
import { JellyfishWallet, WalletHdNode } from '@defichain/jellyfish-wallet';
import { WhaleWalletAccount, WhaleWalletAccountProvider } from '@defichain/whale-api-wallet';
import { WhaleApiClient } from '@defichain/whale-api-client';
import { Bip32Options, MnemonicHdNodeProvider } from '@defichain/jellyfish-wallet-mnemonic';
import { CTransaction, CTransactionSegWit, Vout, toOPCodes } from '@defichain/jellyfish-transaction';
import { Logger } from '../../shared/logger';
import { SignedTxPayload } from '../../shared/communication/operation';
import { BigNumber } from '@defichain/jellyfish-api-core';
import { SmartBuffer } from 'smart-buffer';
import Config from '../../shared/config';
import { Validator } from '../../shared/transaction/validator';
import { CheckSignature, Crypto } from '../../shared/crypto';
import { RawTxDto } from '../../shared/dto/raw-tx.dto';

export class ColdWallet {
  public static NEEDED_SEED_LENGTH = 24;

  private readonly seed: string[];
  private readonly network: Network;
  private readonly logger: Logger;

  private wallet?: JellyfishWallet<WhaleWalletAccount, WalletHdNode>;

  constructor(seed: string[], network: Network) {
    this.seed = seed;
    this.network = network;
    this.logger = new Logger('Cold Wallet');
  }

  public initialize(): void {
    if (!this.checkPrerequisites()) throw new Error('Seed is invalid');
    this.wallet = new JellyfishWallet(
      MnemonicHdNodeProvider.fromWords(this.seed, this.bip32OptionsBasedOn(this.network)),
      new WhaleWalletAccountProvider(undefined as unknown as WhaleApiClient, this.network),
      JellyfishWallet.COIN_TYPE_DFI,
      JellyfishWallet.PURPOSE_LIGHT_MASTERNODE,
    );
  }

  public async getName(): Promise<string> {
    return Config.wallet.name;
  }

  public async getAddress(index = 0): Promise<string> {
    if (!this.wallet) throw new Error('Wallet is not initialized');
    return this.wallet.get(index).getAddress();
  }

  public async signTx(data: RawTxDto): Promise<SignedTxPayload> {
    if (!this.wallet) throw new Error('Wallet is not initialized');

    const check: Partial<CheckSignature> = {
      message: data.rawTx.hex,
    };
    if (
      !Crypto.verifySignature({ signature: data.issuerSignature, address: Config.signature.api, ...check }) ||
      !Crypto.verifySignature({
        signature: data.verifierSignature,
        address: Config.signature.txSigner,
        ...check,
      })
    ) {
      this.logger.warning('Transaction failed signature check');
      return { isError: true, signedTx: '' };
    }
    this.logger.info('signature verification passed');

    const accountIndex = data.payload?.accountIndex ?? 0;
    this.logger.info(`using account index ${accountIndex}`);
    const account = this.wallet.get(accountIndex);

    const tx = this.parseTx(data.rawTx.hex);
    if (!Validator.isAllowed(tx, await account.getScript(), await this.wallet.get(0).getScript())) {
      this.logger.warning('Transaction failed validation', data.rawTx.hex);
      return { isError: true, signedTx: '' };
    }
    this.logger.info('validation passed');

    this.logger.info('signing tx');
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
      this.logger.info('signed tx');
      return { isError: false, signedTx: new CTransactionSegWit(signedTx).toHex() };
    } catch (e) {
      this.logger.error(`While signing tx: ${e}`);
      return { isError: true, signedTx: '' };
    }
  }

  private parseTx(hex: string): CTransaction | CTransactionSegWit {
    this.logger.info('parseTx');
    this.logger.info(hex);
    const smartBuffer = SmartBuffer.fromBuffer(Buffer.from(hex, 'hex'));
    // TODO (Krysh) decide before really parsing if "normal" TX or SegWit
    return new CTransaction(smartBuffer);
    return new CTransactionSegWit(smartBuffer);
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
    return this.seed != null && this.seed.length === ColdWallet.NEEDED_SEED_LENGTH;
  }
}
