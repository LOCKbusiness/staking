import { exit } from 'process';
import { Operation } from '../shared/communication/operation';
import Config from '../shared/config';
import { Logger } from '../shared/logger';
import { Util } from '../shared/util';
import { ColdWalletClient } from './communication/cold-wallet-client';
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
    const client = new ColdWalletClient({
      url: Config.ocean.url,
      version: Config.ocean.version,
      network: Util.readNetwork().name,
    });

    client.setForwardRequest((url, body) => {
      this.logger.info('forwarding', { url, body });
      return this.communication.query(Operation.REQUEST_API, { url, body });
    });

    const wallet = await WalletHelper.restore();
    wallet.setClient(client);
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
