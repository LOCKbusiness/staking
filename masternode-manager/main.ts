import { exit } from 'process';
import { Operation, SignedTxPayload, SignTxPayload } from '../shared/communication/operation';
import { Logger } from '../shared/logger';
import { Util } from '../shared/util';
import { ColdWalletCommunication } from './cold-wallet-communication';
import { Api } from '../shared/api';
import { RawTxDto } from '../shared/dto/raw-tx.dto';

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

    for (;;) {
      try {
        const rawTxDtos = await this.api.getRawTxs(ownerWallet);
        for (const dto of rawTxDtos) {
          const payload: SignedTxPayload = await this.communication.query(
            Operation.SIGN_TX,
            App.createSignTxPayloadBasedOn(dto),
          );
          if (!payload.isError) {
            await this.api.uploadSignedTx({ id: dto.id, hex: payload.signedTx });
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

  private static createSignTxPayloadBasedOn(dto: RawTxDto): SignTxPayload {
    return {
      index: dto.accountIndex,
      hex: dto.rawTx.hex,
      prevouts: dto.rawTx.prevouts,
      scriptHex: dto.rawTx.scriptHex,
      apiSignature: dto.apiSignature,
      masternodeSignature: dto.masternodeSignature,
    };
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
