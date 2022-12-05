import { exit } from 'process';
import { CommunicationType, ICommunication } from '../shared/communication/base/communication.interface';
import { Operation, SignMessagePayload } from '../shared/communication/dto/operation';
import { RawTxDto } from '../shared/dto/raw-tx.dto';
import { Logger } from '../shared/logger';
import { KeyInput } from './peripheral/key-input';
import { Color, Led } from './peripheral/led';
import { Util } from '../shared/util';
import { GatewayCommunication } from './communication/gateway-communication';
import { WalletHelper } from './wallet/wallet-helper';
import Config from '../shared/config';
import { AlarmSystem } from './peripheral/alarm-system';

class App {
  private readonly communication: ICommunication;
  private readonly logger: Logger;

  private readonly led: Led;
  private readonly input: KeyInput;
  private readonly alarmSystem: AlarmSystem;

  constructor() {
    this.communication = GatewayCommunication.create(CommunicationType.SERIAL);
    this.logger = new Logger('Cold Wallet');

    this.led = new Led();
    this.input = new KeyInput(this.led);
    this.alarmSystem = new AlarmSystem(this.led, this.input);
  }

  async run(): Promise<void> {
    try {
      this.logger.info(`running v${Config.version}`);

      // setup UI
      await this.led.connect();
      await this.input.connect();
      await this.alarmSystem.connect();

      this.logger.info('waiting for seed pass code ...');

      // get the seed pass code
      await this.led.blink(Color.BLUE);
      const code = await this.input.readLine();
      if (code.match(/[^0-9]/)) throw new Error('Only numbers are allowed');

      // setup wallet and communication
      await this.led.blink(Color.YELLOW);

      const wallet = await WalletHelper.restore(code);
      wallet.initialize();

      this.logger.info(`wallet ${await wallet.getName()} initialized`);

      this.communication.on(Operation.RECEIVE_WALLET_NAME, () => wallet.getName());
      this.communication.on(Operation.RECEIVE_ADDRESS, () => wallet.getAddress());

      this.communication.on(Operation.SIGN_TX, (data: RawTxDto) => wallet.signTx(data));
      this.communication.on(Operation.SIGN_MESSAGE, (data: SignMessagePayload) => wallet.signMessage(data));

      await this.communication.connect();

      // wallet up
      await this.led.blink(Color.GREEN, Color.BLACK, 1);

      // infinite loop
      for (;;) {
        await Util.sleep(5);
      }
    } catch (e) {
      this.logger.error(`exception:`, e);
      await this.led.set(Color.RED);
    }
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
