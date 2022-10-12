import { exit } from 'process';
import { Operation, SignedTxPayload } from '../shared/communication/operation';
import { Logger } from '../shared/logger';
import { Util } from '../shared/util';
import { ColdWalletCommunication } from './cold-wallet-communication';
import { Api } from '../shared/api';
import Config from '../shared/config';

class App {
  private readonly communication: ColdWalletCommunication;
  private readonly logger: Logger;
  private readonly api: Api;

  constructor() {
    this.communication = new ColdWalletCommunication();
    this.logger = new Logger('Masternode Manager');
    this.api = new Api();
  }

  async run(): Promise<void> {
    await this.communication.connect();

    const ownerWallet: string = await this.communication.query(Operation.RECEIVE_WALLET_NAME);
    this.logger.info('Connected to wallet', ownerWallet);

    const address: string = await this.communication.query(Operation.RECEIVE_ADDRESS);
    const signature: string = await this.communication.query(Operation.SIGN_MESSAGE, Config.api.signMessage + address);
    this.api.setAuthentication({ address, signature });

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
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
