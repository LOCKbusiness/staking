import { exit } from 'process';
import { Operation, SignMessagePayload } from '../shared/communication/operation';
import { RawTxDto } from '../shared/dto/raw-tx.dto';
import { Logger } from '../shared/logger';
import { KeyInput } from '../shared/peripheral/key-input';
import { Color, Led } from '../shared/peripheral/led';
import { Util } from '../shared/util';
import { GatewayCommunication } from './communication/gateway-communication';
import { WalletHelper } from './wallet/wallet-helper';

class App {
  private readonly communication: GatewayCommunication;
  private readonly logger: Logger;

  private readonly led: Led;

  constructor() {
    this.communication = new GatewayCommunication();
    this.logger = new Logger('Cold Wallet');
    this.led = new Led();
  }

  async run(): Promise<void> {
    try {
      // setup UI
      await this.led.connect();

      const input = new KeyInput(this.led);
      await input.connect();

      // get the seed pass code
      await this.led.blink(Color.BLUE);
      const code = await input.readLine();
      if (code.match(/[^0-9]/)) throw new Error('Only numbers are allowed');

      // setup wallet and communication
      await this.led.blink(Color.YELLOW);

      const wallet = await WalletHelper.restore(code);
      wallet.initialize();

      this.communication.on(Operation.RECEIVE_WALLET_NAME, () => wallet.getName());
      this.communication.on(Operation.RECEIVE_ADDRESS, () => wallet.getAddress());

      this.communication.on(Operation.SIGN_TX, (data: RawTxDto) => wallet.signTx(data));
      this.communication.on(Operation.SIGN_MESSAGE, (data: SignMessagePayload) => wallet.signMessage(data));

      await this.communication.connect();

      // wallet up
      await this.led.set(Color.GREEN);

      // infinite loop
      for (;;) {
        await Util.sleep(5);
      }
    } catch (e) {
      this.logger.error(`Exception: ${e}`);
      await this.led.set(Color.RED);
    }
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
