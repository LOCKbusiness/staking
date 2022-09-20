// import { BaseSerialCommunication } from '../../shared/communication/base-serial-communication';

import { BaseServerCommunication } from '../../shared/communication/base-server-communication';

// export class MasternodeCommunication extends BaseSerialCommunication {
//   getPath(): string {
//     return '/dev/serial0';
//   }
// }

export class MasternodeCommunication extends BaseServerCommunication {
  listenOnPort(): number {
    return 9000;
  }
}