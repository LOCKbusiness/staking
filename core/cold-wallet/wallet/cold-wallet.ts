import { Network } from '@defichain/jellyfish-network';
import { JellyfishWallet, WalletHdNode } from '@defichain/jellyfish-wallet';
import { WhaleWalletAccount, WhaleWalletAccountProvider } from '@defichain/whale-api-wallet';
import { Bip32Options, MnemonicHdNodeProvider } from '@defichain/jellyfish-wallet-mnemonic';
import { WhaleApiClient } from '@defichain/whale-api-client';
import { Script, CTransactionSegWit, Vout, toOPCodes } from '@defichain/jellyfish-transaction';
import { P2WPKHTransactionBuilder } from '@defichain/jellyfish-transaction-builder';
import { Logger } from '../../shared/logger';
import { Operation, SignTxPayload } from '../../shared/communication/operation';
import { BigNumber } from '@defichain/jellyfish-api-core';
import { SmartBuffer } from 'smart-buffer';

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

  public async getAddress(index = 0): Promise<string> {
    if (!this.wallet) throw new Error('Wallet is not initialized');
    return this.wallet.get(index).getAddress();
  }

  public async createTx(operation: Operation, payload: any): Promise<string> {
    this.logger.debug('', operation);
    this.logger.debug('', payload);
    const [script, builder] = await this.getTxFoundation();
    const tx = await builder.account.utxosToAccount(
      {
        to: [
          {
            script,
            balances: [
              {
                token: 0,
                amount: new BigNumber(1),
              },
            ],
          },
        ],
      },
      script,
    );
    return new CTransactionSegWit(tx).toHex();
  }

  public async signTx(data: SignTxPayload): Promise<string> {
    if (!this.wallet) throw new Error('Wallet is not initialized');
    const account = this.wallet.get(data.index);
    const tx = this.parseTx(data.hex);
    this.logger.info('signing tx');
    this.logger.info(' with', await account.getAddress());
    const prevouts: Vout[] = data.prevouts.map((p) => {
      return {
        // needs to be recreated as those are objects and not just data
        value: new BigNumber(p.value),
        script: { stack: toOPCodes(SmartBuffer.fromBuffer(Buffer.from(data.witness, 'hex'))) },
        tokenId: p.tokenId,
      };
    });
    const signedTx = await account.signTx(tx, prevouts);
    this.logger.info('signed tx');
    return new CTransactionSegWit(signedTx).toHex();
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
