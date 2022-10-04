import { Network } from '@defichain/jellyfish-network';
import { JellyfishWallet, WalletHdNode } from '@defichain/jellyfish-wallet';
import { WhaleWalletAccount, WhaleWalletAccountProvider } from '@defichain/whale-api-wallet';
import { Bip32Options, MnemonicHdNodeProvider } from '@defichain/jellyfish-wallet-mnemonic';
import { Script, CTransactionSegWit, Vout, toOPCodes } from '@defichain/jellyfish-transaction';
import { P2WPKHTransactionBuilder } from '@defichain/jellyfish-transaction-builder';
import { Logger } from '../../shared/logger';
import { fromAddress } from '@defichain/jellyfish-address';
import { PayoutAllPayload, SignedTxPayload, SignTxPayload } from '../../shared/communication/operation';
import { BigNumber } from '@defichain/jellyfish-api-core';
import { SmartBuffer } from 'smart-buffer';
import Config from '../../shared/config';
import { ColdWalletClient } from '../communication/cold-wallet-client';
import { Validator } from '../transaction/validator';
import { CheckSignature, Crypto } from '../../shared/crypto';

export class ColdWallet {
  public static NEEDED_SEED_LENGTH = 24;

  private readonly seed: string[];
  private readonly network: Network;
  private readonly logger: Logger;

  private wallet?: JellyfishWallet<WhaleWalletAccount, WalletHdNode>;
  private client?: ColdWalletClient;

  constructor(seed: string[], network: Network) {
    this.seed = seed;
    this.network = network;
    this.logger = new Logger('Cold Wallet');
  }

  public setClient(client: ColdWalletClient) {
    this.client = client;
  }

  public initialize(): void {
    if (!this.checkPrerequisites()) throw new Error('Seed is invalid');
    this.wallet = new JellyfishWallet(
      MnemonicHdNodeProvider.fromWords(this.seed, this.bip32OptionsBasedOn(this.network)),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      new WhaleWalletAccountProvider(this.client!, this.network),
      JellyfishWallet.COIN_TYPE_DFI,
      JellyfishWallet.PURPOSE_LIGHT_MASTERNODE,
    );
  }

  public async getAddress(index = 0): Promise<string> {
    if (!this.wallet) throw new Error('Wallet is not initialized');
    return this.wallet.get(index).getAddress();
  }

  public async signTx(data: SignTxPayload): Promise<SignedTxPayload> {
    if (!this.wallet) throw new Error('Wallet is not initialized');

    const check: Partial<CheckSignature> = {
      message: data.hex,
    };
    if (
      !Crypto.verifySignature({ signature: data.apiSignature, address: Config.liquidity.signatureAddress, ...check }) ||
      !Crypto.verifySignature({
        signature: data.masternodeSignature,
        address: Config.masternode.signatureAddress,
        ...check,
      })
    ) {
      this.logger.warning('Transaction failed signature check');
      return { isError: true, signedTx: '' };
    }
    this.logger.info('signature verification passed');

    const account = this.wallet.get(data.index);

    const tx = this.parseTx(data.hex);
    if (!Validator.isAllowed(tx, data, await account.getScript())) {
      this.logger.warning('Transaction failed validation', data.hex);
      return { isError: true, signedTx: '' };
    }
    this.logger.info('validation passed');

    this.logger.info('signing tx');
    this.logger.info(' with', await account.getAddress());
    const prevouts: Vout[] = data.prevouts.map((p) => {
      return {
        // needs to be recreated as those are objects and not just data
        value: new BigNumber(p.value),
        script: { stack: toOPCodes(SmartBuffer.fromBuffer(Buffer.from(data.scriptHex, 'hex'))) },
        tokenId: p.tokenId,
      };
    });
    try {
      const signedTx = await account.signTx(tx, prevouts);
      this.logger.info('signed tx');
      return { isError: false, signedTx: new CTransactionSegWit(signedTx).toHex() };
    } catch (e) {
      this.logger.error(`While signing tx`);
      return { isError: true, signedTx: '' };
    }
  }

  public async payout(data: PayoutAllPayload): Promise<SignedTxPayload> {
    if (!this.wallet) throw new Error('Wallet is not initialized');
    const owner = await this.getAddress(data.index);
    const unspent = await this.client?.address.listTransactionUnspent(owner);
    if (!unspent || unspent.length === 0) {
      this.logger.error(`No prevouts on ${owner}, therefore can't payout anything!`);
      return { isError: true, signedTx: '' };
    }
    const toScript = this.getLiquidityManagerScript();
    const [, builder] = await this.getTxFoundation(data.index);
    try {
      const tx = await builder.utxo.sendAll(toScript);
      return { isError: false, signedTx: new CTransactionSegWit(tx).toHex() };
    } catch (e) {
      this.logger.error(`While building sendAll from ${owner} to liquidity manager`);
      return { isError: true, signedTx: '' };
    }
  }

  private parseTx(hex: string): CTransactionSegWit {
    this.logger.info('parseTx');
    return new CTransactionSegWit(SmartBuffer.fromBuffer(Buffer.from(hex, 'hex')));
  }

  private async getTxFoundation(accountIndex = 0): Promise<[Script, P2WPKHTransactionBuilder]> {
    if (!this.wallet) throw new Error('Wallet is not initialized');
    const account = this.wallet.get(accountIndex);
    return [await account.getScript(), account.withTransactionBuilder()];
  }

  private getLiquidityManagerScript(): Script {
    const decodedAddress = fromAddress(Config.liquidity.walletAddress, this.network.name);
    if (!decodedAddress?.script) throw new Error('Could not parse script for liquidity manager');
    return decodedAddress.script;
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
    return this.seed != null && this.seed.length === ColdWallet.NEEDED_SEED_LENGTH && this.client != null;
  }
}
