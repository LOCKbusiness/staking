import { exit } from 'process';
import { Operation } from '../shared/communication/operation';
import { Logger } from '../shared/logger';
import { Util } from '../shared/util';
import { ColdWalletCommunication } from './cold-wallet-communication';

class App {
  private readonly communication: ColdWalletCommunication;
  private readonly logger: Logger;

  constructor() {
    this.communication = new ColdWalletCommunication();
    this.logger = new Logger('Masternode Manager');
  }

  async run(): Promise<void> {
    await this.communication.connect();
    const message = await this.communication.query(Operation.TEST, undefined);
    this.logger.info('received answer', message);

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
