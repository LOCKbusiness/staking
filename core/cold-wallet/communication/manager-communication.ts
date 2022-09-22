// import { BaseSerialCommunication } from '../../shared/communication/base-serial-communication';

import { BaseServerCommunication } from '../../shared/communication/base-server-communication';
import { Message } from '../../shared/communication/message';
import { Operation } from '../../shared/communication/operation';

// export class ManagerCommunication extends BaseSerialCommunication {
//   getPath(): string {
//     return '/dev/serial0';
//   }
// }

export class ManagerCommunication extends BaseServerCommunication {
  private createTxBasedOnOperation?: (operation: Operation, payload?: any) => Promise<string>;

  listenOnPort(): number {
    return 9000;
  }

  setCreateTx(func: (operation: Operation, payload?: any) => Promise<string>) {
    this.createTxBasedOnOperation = func;
  }

  async actOn(message: Message): Promise<Message | undefined> {
    switch (message.operation) {
      case Operation.TEST:
        return {
          ...message,
          payload: { txHex: await this.createTxBasedOnOperation?.(message.operation, message.payload) },
        };
      default:
        return undefined;
    }
  }
}
