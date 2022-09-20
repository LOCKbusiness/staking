import { Network } from '@defichain/jellyfish-network';
import { JellyfishWallet, WalletHdNode } from '@defichain/jellyfish-wallet';
import { WhaleWalletAccount, WhaleWalletAccountProvider } from '@defichain/whale-api-wallet';
import { Bip32Options, MnemonicHdNodeProvider } from '@defichain/jellyfish-wallet-mnemonic';
import { WhaleApiClient } from '@defichain/whale-api-client';

export class ColdWallet {
  public static NEEDED_SEED_LENGTH = 24;
  private seed: string[];
  private network: Network;
  private client: WhaleApiClient;

  private wallet: JellyfishWallet<WhaleWalletAccount, WalletHdNode> | undefined;

  constructor(seed: string[], network: Network) {
    this.seed = seed;
    this.network = network;
    this.client = new WhaleApiClient({
      url: process.env.OCEAN_URL,
      version: process.env.OCEAN_VERSION,
      network: network.name,
    });
  }

  public initialize(): void {
    if (!this.checkPrerequisites()) throw new Error('Seed is invalid');
    this.wallet = new JellyfishWallet(
      MnemonicHdNodeProvider.fromWords(this.seed, this.bip32OptionsBasedOn(this.network)),
      new WhaleWalletAccountProvider(this.client, this.network),
      JellyfishWallet.COIN_TYPE_DFI,
      JellyfishWallet.PURPOSE_LIGHT_MASTERNODE,
    );
  }

  public async getAddress(): Promise<string> {
    if (!this.wallet) throw new Error('Wallet is not initialized');
    return this.wallet.get(0).getAddress();
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
