import { exit } from 'process';
import { Operation, SignedTxPayload, SignTxPayload } from '../shared/communication/operation';
import { Logger } from '../shared/logger';
import { Util } from '../shared/util';
import { ColdWalletCommunication } from './cold-wallet-communication';
import { Api } from '../shared/api';

class App {
  private readonly communication: ColdWalletCommunication;
  private readonly logger: Logger;
  private readonly api: Api;

  constructor() {
    this.communication = new ColdWalletCommunication();
    this.logger = new Logger('Masternode Manager');
    this.api = new Api();
  }

  async run(): Promise<void> {
    await this.communication.connect();

    for (;;) {
      try {
        // fetch info from API
        // check if something needs to be done by this wallet
      } catch (e) {
        this.logger.error(`Exception: ${e}`);
      } finally {
        await Util.sleep(5);
      }
    }
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
