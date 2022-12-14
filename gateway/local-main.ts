import { exit } from 'process';
import { Operation, SignedMessagePayload, SignedTxPayload } from '../shared/communication/dto/operation';
import { Logger } from '../shared/logger';
import { Util } from '../shared/util';
import { ColdWalletCommunication } from './communication/cold-wallet-communication';
import { Api } from './api/api';
import { CommunicationType, ICommunication } from '../shared/communication/base/communication.interface';

class App {
  private readonly communication: ICommunication;
  private readonly logger: Logger;
  private readonly api: Api;

  constructor() {
    this.communication = ColdWalletCommunication.create(CommunicationType.TCP);
    this.logger = new Logger('Gateway');
    this.api = new Api();
  }

  async run(): Promise<void> {
    let ownerWallet: string | undefined = undefined;
    do {
      ownerWallet = await this.setupNeededComponents();
      if (!ownerWallet) {
        this.logger.info('... retrying in 5 seconds ...');
        await Util.sleep(5);
      }
    } while (!ownerWallet);

    for (;;) {
      try {
        const rawTxDtos = await this.api.getTransactions(ownerWallet);
        for (const dto of rawTxDtos) {
          const payload: SignedTxPayload = await this.communication.query(Operation.SIGN_TX, dto);
          if (!payload.isError) {
            await this.api.uploadSignedTransaction({ id: dto.id, hex: payload.signedTx });
          } else {
            this.logger.error('Received sign tx error from cold wallet');
          }
        }
      } catch (e) {
        this.logger.error(`Exception: ${e}`);
      } finally {
        await Util.sleep(5);
      }
    }
  }

  async setupNeededComponents(): Promise<string | undefined> {
    try {
      await this.communication.connect();

      const ownerWallet: string = await this.communication.query(Operation.RECEIVE_WALLET_NAME);
      this.logger.info('Connected to wallet', ownerWallet);

      const address: string = await this.communication.query(Operation.RECEIVE_ADDRESS);
      const message = await this.api.getSignMessage(address);
      const result: SignedMessagePayload = await this.communication.query(Operation.SIGN_MESSAGE, {
        message,
        accountIndex: 0,
      });
      this.api.setAuthentication({ address, signature: result.signedMessage });
      return ownerWallet;
    } catch (e) {
      await this.communication.disconnect();
      this.logger.error(`Exception while setting up needed components: ${e}`);
      return undefined;
    }
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
