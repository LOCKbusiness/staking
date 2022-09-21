import { exit } from 'process';
import { Operation, TestPayload } from '../shared/communication/operation';
import { Logger } from '../shared/logger';
import { Util } from '../shared/util';
import { ColdWalletCommunication } from './cold-wallet-communication';
import { WhaleApiClient } from '@defichain/whale-api-client';
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
    const message = (await this.communication.query(Operation.TEST, undefined)) as TestPayload;
    await this.client.rawtx.send({ hex: message.txHex });

    try {
      while (true) {
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

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
