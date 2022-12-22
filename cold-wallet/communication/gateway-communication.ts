import { SerialCommunication } from '../../shared/communication/serial-communication';
import { ServerCommunication } from '../../shared/communication/server-communication';
import { CommunicationType, ICommunication } from '../../shared/communication/base/communication.interface';
import { UserInterface } from '../ui/user-interface';

export class GatewayCommunication {
  static create(type: CommunicationType, ui?: UserInterface): ICommunication {
    switch (type) {
      case CommunicationType.SERIAL:
        return new SerialCommunication(ui);
      case CommunicationType.TCP:
        return new ServerCommunication(ui);
    }
  }
}
