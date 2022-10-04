// import { BaseSerialCommunication } from '../../shared/communication/base-serial-communication';

import { BaseServerCommunication } from '../../shared/communication/base-server-communication';

// export class ManagerCommunication extends BaseSerialCommunication {
//   getPath(): string {
//     return '/dev/serial0';
//   }
// }

export class ManagerCommunication extends BaseServerCommunication {
  listenOnPort(): number {
    return 9000;
  }
}
