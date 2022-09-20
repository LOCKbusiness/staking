import { Network } from '@defichain/jellyfish-network';
import { JellyfishWallet, WalletHdNode } from '@defichain/jellyfish-wallet';
import { WhaleWalletAccount, WhaleWalletAccountProvider } from '@defichain/whale-api-wallet';
import { Bip32Options, MnemonicHdNodeProvider } from '@defichain/jellyfish-wallet-mnemonic';
import {
  ApiPagedResponse,
  Method,
  ResponseAsString,
  WhaleApiClient,
  WhaleApiResponse,
} from '@defichain/whale-api-client';
import { Logger } from '../../shared/logger';

export class ColdWallet {
  public static NEEDED_SEED_LENGTH = 24;
  private seed: string[];
  private network: Network;
  private client: WhaleApiClient;

  private wallet: JellyfishWallet<WhaleWalletAccount, WalletHdNode> | undefined;

  constructor(seed: string[], network: Network) {
    this.seed = seed;
    this.network = network;
    // TODO (Krysh) remove this client as soon as serial communication is setup
    // cold wallet should not need to have internet access
    this.client = new ColdWalletClient({
      url: process.env.OCEAN_URL,
      version: process.env.OCEAN_VERSION,
      network: network.name,
    });
  }

  public initialize(): void {
    if (!this.checkPrerequisites()) throw new Error('Seed is invalid');
    this.wallet = new JellyfishWallet(
      MnemonicHdNodeProvider.fromWords(this.seed, this.bip32OptionsBasedOn(this.network)),
      new WhaleWalletAccountProvider(undefined as unknown as WhaleApiClient, this.network), // if crashes occur change to ColdWalletClient, need to overwrite all properties
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

class ColdWalletClient extends WhaleApiClient {
  private readonly logger = new Logger('Cold Wallet Client');

  paginate<T>(response: ApiPagedResponse<T>): Promise<ApiPagedResponse<T>> {
    this.logger.info('paginate');
    return super.paginate(response);
  }

  requestData<T>(method: Method, path: string, object?: any): Promise<T> {
    this.logger.info('requestData');
    return super.requestData(method, path, object);
  }

  requestList<T>(method: Method, path: string, size: number, next?: string | undefined): Promise<ApiPagedResponse<T>> {
    this.logger.info('requestList');
    return super.requestList(method, path, size, next);
  }

  requestAsApiResponse<T>(method: Method, path: string, object?: any): Promise<WhaleApiResponse<T>> {
    this.logger.info('requestAsApiResponse');
    return super.requestAsApiResponse(method, path, object);
  }

  requestAsString(method: Method, path: string, body?: string | undefined): Promise<ResponseAsString> {
    this.logger.info('requestAsString');
    return super.requestAsString(method, path, body);
  }
}
