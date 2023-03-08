import { exit } from 'process';
import { CommunicationType, ICommunication } from '../shared/communication/base/communication.interface';
import { Operation, SignMessagePayload } from '../shared/communication/dto/operation';
import { RawTxDto } from '../shared/dto/raw-tx.dto';
import { Logger } from '../shared/logger';
import { Util } from '../shared/util';
import { GatewayCommunication } from './communication/gateway-communication';
import { WalletHelper } from './wallet/wallet-helper';
import Config from '../shared/config';
import { AlarmSystem } from './peripheral/alarm-system';
import { UserInterface } from './ui/user-interface';
import { UiState } from './ui/ui-state.enum';

class App {
  private readonly communication: ICommunication;
  private readonly logger: Logger;

  private readonly ui: UserInterface;
  private readonly alarmSystem: AlarmSystem;

  constructor() {
    this.logger = new Logger('Cold Wallet');

    this.ui = new UserInterface();
    this.alarmSystem = new AlarmSystem(this.ui);
    this.communication = GatewayCommunication.create(CommunicationType.SERIAL, this.ui);
  }

  async run(): Promise<void> {
    try {
      this.logger.info(`running v${Config.version}`);

      // setup UI
      await this.ui.connect();

      this.logger.info('waiting for seed pass code ...');

      // get the seed pass code
      await this.ui.set(UiState.WAITING);
      const code = await this.ui.readLine();
      if (code.match(/[^0-9]/)) throw new Error('Only numbers are allowed');

      // setup wallet and communication
      await this.ui.set(UiState.LOADING);
      const wallet = await WalletHelper.restore(code);
      await wallet.initialize();

      this.logger.info(`wallet ${await wallet.getName()} initialized`);

      this.communication.on(Operation.RECEIVE_WALLET_NAME, () => wallet.getName());
      this.communication.on(Operation.RECEIVE_ADDRESS, () => wallet.getAddress());

      this.communication.on(Operation.SIGN_TX, (data: RawTxDto) => wallet.signTx(data));
      this.communication.on(Operation.SIGN_MESSAGE, (data: SignMessagePayload) => wallet.signMessage(data));

      await this.communication.connect();

      // wallet up
      await this.ui.reset(UiState.LOADING);
      await this.ui.showSuccess();

      await this.alarmSystem.connect();

      // infinite loop
      for (;;) {
        await Util.sleep(5);
      }
    } catch (e) {
      this.logger.error(`exception:`, e);
      await this.ui.set(UiState.ERROR);
    }
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
