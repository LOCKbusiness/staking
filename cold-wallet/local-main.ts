import { exit } from 'process';
import { Operation, SignMessagePayload } from '../shared/communication/operation';
import { RawTxDto } from '../shared/dto/raw-tx.dto';
import { Logger } from '../shared/logger';
import { Util } from '../shared/util';
import { GatewayCommunication } from './communication/gateway-communication';
import { WalletHelper } from './wallet/wallet-helper';

class App {
  private readonly communication: GatewayCommunication;
  private readonly logger: Logger;

  constructor() {
    this.communication = new GatewayCommunication();
    this.logger = new Logger('Cold Wallet');
  }

  async run(): Promise<void> {
    try {
      const wallet = await WalletHelper.restore('');
      wallet.initialize();

      this.communication.on(Operation.RECEIVE_WALLET_NAME, () => wallet.getName());
      this.communication.on(Operation.RECEIVE_ADDRESS, () => wallet.getAddress());

      this.communication.on(Operation.SIGN_TX, (data: RawTxDto) => wallet.signTx(data));
      this.communication.on(Operation.SIGN_MESSAGE, (data: SignMessagePayload) => wallet.signMessage(data));

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
