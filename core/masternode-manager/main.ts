import { exit } from 'process';
import { Operation, RequestApiPayload } from '../shared/communication/operation';
import { Logger } from '../shared/logger';
import { Util } from '../shared/util';
import { ColdWalletCommunication } from './cold-wallet-communication';
import fetch from 'cross-fetch';
import { Method, ResponseAsString, WhaleApiClient } from '@defichain/whale-api-client';
import Config from '../shared/config';

class App {
  private readonly communication: ColdWalletCommunication;
  private readonly logger: Logger;
  private readonly client: WhaleApiClient;

  constructor() {
    this.communication = new ColdWalletCommunication();
    this.logger = new Logger('Masternode Manager');
    this.client = new WhaleApiClient({
      url: Config.ocean.url,
      version: Config.ocean.version,
      network: Util.readNetwork().name,
    });
  }

  async run(): Promise<void> {
    await this.communication.connect();

    this.communication.on(Operation.REQUEST_API, (data: RequestApiPayload) => _fetch('GET', data.url, data.body));
    const hex = await this.communication.query(Operation.TEST);
    this.logger.info('received tx', hex);
    // await this.client.rawtx.send({ hex });

    try {
      for (;;) {
        // fetch info from API
        // parse and create operations
        // send operations via cold wallet communication
        await Util.sleep(5);
      }
    } catch (e) {
      this.logger.error(`Exception: ${e}`);
      await this.communication.disconnect();
    }
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
