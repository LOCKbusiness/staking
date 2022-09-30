import { exit } from 'process';
import { Operation, RequestApiPayload, SignTxPayload } from '../shared/communication/operation';
import { Logger } from '../shared/logger';
import { Util } from '../shared/util';
import { ColdWalletCommunication } from './cold-wallet-communication';
import fetch from 'cross-fetch';
import { Method, ResponseAsString, WhaleApiClient } from '@defichain/whale-api-client';
import Config from '../shared/config';
import { Api } from '../shared/api';
import { SignedMasternodeTxDto, RawTxCreateMasternodeDto, RawTxResignMasternodeDto } from '../shared/dto/masternode';

class App {
  private readonly communication: ColdWalletCommunication;
  private readonly logger: Logger;
  private readonly api: Api;
  private readonly client: WhaleApiClient;

  constructor() {
    this.communication = new ColdWalletCommunication();
    this.logger = new Logger('Masternode Manager');
    this.api = new Api();
    this.client = new WhaleApiClient({
      url: Config.ocean.url,
      version: Config.ocean.version,
      network: Util.readNetwork().name,
    });
  }

  async run(): Promise<void> {
    await this.communication.connect();

    this.communication.on(Operation.REQUEST_API, (data: RequestApiPayload) => _fetch('GET', data.url, data.body));

    for (;;) {
      try {
        // fetch info from API
        const rawTxCreateMasternodes = await this.api.getMasternodesCreating(Config.wallet.name);
        // parse and create operations
        if (rawTxCreateMasternodes.length > 0) {
          const signedMasternodeTxs = await this.signMasternodes(rawTxCreateMasternodes);
          for (const signedMasternodeTx of signedMasternodeTxs) {
            this.logger.info('create masternode', signedMasternodeTx.id);
            try {
              await this.api.createMasternode(signedMasternodeTx);
            } catch (e) {
              this.logger.error('Sending create masternode ERROR:', e);
            }
          }
        }

        const rawTxResignMasternodes = await this.api.getMasternodesResigning(Config.wallet.name);

        if (rawTxResignMasternodes.length > 0) {
          const signedMasternodeTxs = await this.signMasternodes(rawTxResignMasternodes);
          for (const signedMasternodeTx of signedMasternodeTxs) {
            this.logger.info('resign masternode', signedMasternodeTx.id);
            try {
              await this.api.resignMasternode(signedMasternodeTx);
            } catch (e) {
              this.logger.error('Sending resign masternode ERROR:', e);
            }
          }
        }
      } catch (e) {
        this.logger.error(`Exception: ${e}`);
      } finally {
        await Util.sleep(5);
      }
    }
  }

  async signMasternodes(
    infos: RawTxCreateMasternodeDto[] | RawTxResignMasternodeDto[],
  ): Promise<SignedMasternodeTxDto[]> {
    this.logger.info('masternodes to sign', infos.length);

    const result: SignedMasternodeTxDto[] = [];
    for (const info of infos) {
      const payload: SignTxPayload = {
        index: info.accountIndex,
        hex: info.rawTx.hex,
        prevouts: info.rawTx.prevouts,
        scriptHex: info.rawTx.scriptHex,
      };
      result.push({
        id: info.id,
        signedTx: await this.communication.query(Operation.SIGN_TX, payload),
      });
    }
    return result;
  }
}

async function _fetch(method: Method, url: string, body?: string): Promise<ResponseAsString> {
  const response = await fetch(url, {
    method: method,
    headers: method !== 'GET' ? { 'Content-Type': 'application/json' } : {},
    body: body,
    cache: 'no-cache',
  });

  return {
    status: response.status,
    body: await response.text(),
  };
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
