import { Network } from '@defichain/jellyfish-network';
import { JellyfishWallet, WalletHdNode } from '@defichain/jellyfish-wallet';
import { WhaleWalletAccount, WhaleWalletAccountProvider } from '@defichain/whale-api-wallet';
import { Bip32Options, MnemonicHdNodeProvider } from '@defichain/jellyfish-wallet-mnemonic';
import { WhaleApiClient } from '@defichain/whale-api-client';
import { Script, CTransactionSegWit } from '@defichain/jellyfish-transaction';
import { P2WPKHTransactionBuilder } from '@defichain/jellyfish-transaction-builder';
import { Logger } from '../../shared/logger';
import { Operation } from '../../shared/communication/operation';
import { BigNumber } from '@defichain/jellyfish-api-core';

export class ColdWallet {
  public static NEEDED_SEED_LENGTH = 24;

  private readonly seed: string[];
  private readonly network: Network;
  private readonly logger: Logger;

  private wallet?: JellyfishWallet<WhaleWalletAccount, WalletHdNode>;
  private client?: WhaleApiClient;

  constructor(seed: string[], network: Network) {
    this.seed = seed;
    this.network = network;
    this.logger = new Logger('Cold Wallet');
  }

  public setClient(client: WhaleApiClient) {
    this.client = client;
  }

  public initialize(): void {
    if (!this.checkPrerequisites()) throw new Error('Seed is invalid');
    this.wallet = new JellyfishWallet(
      MnemonicHdNodeProvider.fromWords(this.seed, this.bip32OptionsBasedOn(this.network)),
      new WhaleWalletAccountProvider(this.client!, this.network),
      JellyfishWallet.COIN_TYPE_DFI,
      JellyfishWallet.PURPOSE_LIGHT_MASTERNODE,
    );
  }

  public async getAddress(): Promise<string> {
    if (!this.wallet) throw new Error('Wallet is not initialized');
    return this.wallet.get(0).getAddress();
  }

  public async createTx(operation: Operation, payload: any): Promise<string> {
    if (!this.wallet) throw new Error('Wallet is not initialized');
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

  private async getTxFoundation(accountIndex: number = 0): Promise<[Script, P2WPKHTransactionBuilder]> {
    if (!this.wallet) throw new Error('Wallet is not initialized');
    const account = this.wallet?.get(accountIndex);
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
    return this.seed != null && this.seed.length === ColdWallet.NEEDED_SEED_LENGTH && this.client != null;
  }
}
