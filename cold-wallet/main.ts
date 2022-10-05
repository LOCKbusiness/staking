import { exit } from 'process';
import { Operation, SignTxPayload } from '../shared/communication/operation';
import { Logger } from '../shared/logger';
import { Util } from '../shared/util';
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
    const wallet = await WalletHelper.restore();
    wallet.initialize();

    this.logger.info(await wallet.getAddress());

    this.communication.on(Operation.SIGN_TX, (data: SignTxPayload) => wallet.signTx(data));

    await this.communication.connect();

    for (;;) {
      try {
        await Util.sleep(1);
      } catch (e) {
        this.logger.error(`Exception: ${e}`);
      }
    }
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
