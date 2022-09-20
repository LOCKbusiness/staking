// import { BaseSerialCommunication } from '../shared/communication/base-serial-communication';

import { BaseSocketCommunication } from '../shared/communication/base-socket-communication';

// export class ColdWalletCommunication extends BaseSerialCommunication {
//   getPath(): string {
//     return '/dev/cu.usbserial-01434108';
//   }
// }

export class ColdWalletCommunication extends BaseSocketCommunication {
  connectToPort(): number {
    return 9000;
  }
}
