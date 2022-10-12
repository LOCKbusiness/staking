import { exit } from 'process';
import { Operation } from '../shared/communication/operation';
import { RawTxDto } from '../shared/dto/raw-tx.dto';
import { Logger } from '../shared/logger';
import { KeyInput } from '../shared/peripheral/key-input';
import { Color, Led } from '../shared/peripheral/led';
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
    try {
      const wallet = await WalletHelper.restore('');
      wallet.initialize();

      this.communication.on(Operation.RECEIVE_WALLET_NAME, () => wallet.getName());
      this.communication.on(Operation.RECEIVE_ADDRESS, () => wallet.getAddress());

      this.communication.on(Operation.SIGN_TX, (data: RawTxDto) => wallet.signTx(data));
      this.communication.on(Operation.SIGN_MESSAGE, (data: string) => wallet.signMessage(data));

      await this.communication.connect();

      // infinite loop
      for (;;) {
        await Util.sleep(5);
      }
    } catch (e) {
      this.logger.error(`Exception: ${e}`);
    }
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
