import { config } from 'dotenv';
import { exit } from 'process';
import { Operation } from '../shared/communication/operation';
import { Logger } from '../shared/logger';
import { Util } from '../shared/util';
import { MasternodeCommunication } from './communication/masternode-communication';
import { WalletHelper } from './wallet/wallet-helper';

class App {
  private readonly communication: MasternodeCommunication;
  private readonly logger: Logger;

  constructor() {
    config();
    this.communication = new MasternodeCommunication();
    this.logger = new Logger('Cold Wallet');
  }

  async run(): Promise<void> {
    const wallet = await WalletHelper.restore();
    wallet.initialize();
    this.logger.info(await wallet.getAddress());

    await this.communication.connect();

    try {
      while (true) {
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
