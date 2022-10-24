import { SerialCommunication } from '../../shared/communication/serial-communication';
import { ServerCommunication } from '../../shared/communication/server-communication';
import { CommunicationType, ICommunication } from '../../shared/communication/base/communication.interface';
import Config from '../../shared/config';

export class GatewayCommunication {
  static create(type: CommunicationType): ICommunication {
    switch (type) {
      case CommunicationType.SERIAL:
        return new SerialCommunication(Config.communication.serialPath);
      case CommunicationType.TCP:
        return new ServerCommunication(9000);
    }
  }
}
