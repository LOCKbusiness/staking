import { exit } from 'process';
import { Logger } from '../shared/logger';
import { Util } from '../shared/util';
import { MasternodeCommunication } from './communication/masternode-communication';
import { WalletHelper } from './wallet/wallet-helper';

class App {
  private readonly communication: MasternodeCommunication;
  private readonly logger: Logger;

  constructor() {
    this.communication = new MasternodeCommunication();
    this.logger = new Logger('Cold Wallet');
  }

  async run(): Promise<void> {
    const wallet = await WalletHelper.restore();
    wallet.initialize();
    this.logger.info(await wallet.getAddress());

    this.communication.setCreateTx((operation, payload) => {
      return wallet.createTx(operation, payload);
    });

    await this.communication.connect();

    try {
      while (true) {
        await Util.sleep(1);
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
