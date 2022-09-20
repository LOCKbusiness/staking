// import { BaseSerialCommunication } from '../../shared/communication/base-serial-communication';

import { BaseServerCommunication } from '../../shared/communication/base-server-communication';
import { Message } from '../../shared/communication/message';
import { Operation } from '../../shared/communication/operation';

// export class MasternodeCommunication extends BaseSerialCommunication {
//   getPath(): string {
//     return '/dev/serial0';
//   }
// }

export class MasternodeCommunication extends BaseServerCommunication {
  private createTxBasedOnOperation?: (operation: Operation, payload: any) => Promise<string>;

  listenOnPort(): number {
    return 9000;
  }

  setCreateTx(func: (operation: Operation, payload: any) => Promise<string>) {
    this.createTxBasedOnOperation = func;
  }

  async onDataReceived(data: any): Promise<Message> {
    const message = JSON.parse(String(data)) as Message;
    this.logger.info('received', message.operation);
    if (message.payload != null) {
      this.logger.info(' and', message.payload);
    }
    return {
      ...message,
      payload: { txHex: await this.createTxBasedOnOperation?.(message.operation, message.payload) },
    };
  }
}
