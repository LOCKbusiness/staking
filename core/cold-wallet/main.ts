import { exit } from 'process';
import { Operation, SignTxPayload } from '../shared/communication/operation';
import Config from '../shared/config';
import { Logger } from '../shared/logger';
import { Util } from '../shared/util';
import { Action, ColdWalletClient } from './communication/cold-wallet-client';
import { ManagerCommunication } from './communication/manager-communication';
import { WalletHelper } from './wallet/wallet-helper';

class App {
  private readonly communication: ManagerCommunication;
  private readonly logger: Logger;

  constructor() {
    this.communication = new ManagerCommunication();
    this.logger = new Logger('Cold Wallet');
  }

  async run(): Promise<void> {
    const client = new ColdWalletClient({
      url: Config.ocean.url,
      version: Config.ocean.version,
      network: Util.readNetwork().name,
    });

    client.on(Action.REQUEST_OCEAN, (url, body) => {
      this.logger.debug('forwarding', { url, body });
      return this.communication.query(Operation.REQUEST_API, { url, body });
    });

    const wallet = await WalletHelper.restore();
    wallet.initialize();
    this.logger.info(await wallet.getAddress());

    this.communication.on(Operation.TEST, (data) => wallet.createTx(Operation.TEST, data));
    this.communication.on(Operation.SIGN_TX, (data: SignTxPayload) => wallet.signTx(data));

    await this.communication.connect();

    try {
      for (;;) {
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
