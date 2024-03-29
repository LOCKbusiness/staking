import { exit } from 'process';
import { Operation, SignedMessagePayload, SignedTxPayload } from '../shared/communication/dto/operation';
import { Logger } from '../shared/logger';
import { Util } from '../shared/util';
import { ColdWalletCommunication } from './communication/cold-wallet-communication';
import { Api } from './api/api';
import { CommunicationType, ICommunication } from '../shared/communication/base/communication.interface';
import Config from '../shared/config';

class App {
  private readonly communication: ICommunication;
  private readonly logger: Logger;
  private readonly api: Api;

  constructor() {
    this.communication = ColdWalletCommunication.create(CommunicationType.SERIAL);
    this.logger = new Logger('Gateway');
    this.api = new Api();
  }

  async run(): Promise<void> {
    this.logger.info(`running v${Config.version}`);

    const walletName = await this.setupNeededComponents();

    for (;;) {
      try {
        const rawTxDtos = await this.api.getTransactions(walletName);

        if (rawTxDtos.length > 0) {
          this.logger.info(`signing ${rawTxDtos.length} transactions ...`);

          for (const dto of rawTxDtos) {
            const payload: SignedTxPayload = await this.communication.query(Operation.SIGN_TX, dto);
            if (!payload.isError) {
              await this.api.uploadSignedTransaction({ id: dto.id, hex: payload.signedTx });
              this.logger.info(`   - ${dto.id} done`);
            } else {
              this.logger.info(`   - ${dto.id} failed`);
            }
          }
        } else {
          await this.communication.query(Operation.PING);
        }
      } catch (e) {
        this.logger.error(`exception:`, e);
      } finally {
        await Util.sleep(Config.api.pollInterval);
      }
    }
  }

  async setupNeededComponents(): Promise<string> {
    try {
      await this.communication.connect();

      // get wallet name
      const walletName: string = await this.communication.query(Operation.RECEIVE_WALLET_NAME);
      this.logger.info('connected to wallet', walletName);

      // get API login credentials
      const address: string = await this.communication.query(Operation.RECEIVE_ADDRESS);
      const message = await this.api.getSignMessage(address);
      const result: SignedMessagePayload = await this.communication.query(Operation.SIGN_MESSAGE, {
        message,
        accountIndex: 0,
      });

      this.api.setAuthentication({ address, signature: result.signedMessage });
      return walletName;
    } catch (e) {
      await this.communication.disconnect();
      this.logger.error(`exception while setting up needed components:`, e);
      throw e;
    }
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
