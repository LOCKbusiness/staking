import { CommunicationType, ICommunication } from '../shared/communication/base/communication.interface';
import { SerialCommunication } from '../shared/communication/serial-communication';
import { SocketCommunication } from '../shared/communication/socket-communication';
import Config from '../shared/config';

export class ColdWalletCommunication {
  static create(type: CommunicationType): ICommunication {
    switch (type) {
      case CommunicationType.SERIAL:
        return new SerialCommunication(Config.communication.serialPath);
      case CommunicationType.TCP:
        return new SocketCommunication(9000);
    }
  }
}
