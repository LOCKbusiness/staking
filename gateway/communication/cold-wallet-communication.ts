import { UserInterface } from '../../cold-wallet/ui/user-interface';
import { CommunicationType, ICommunication } from '../../shared/communication/base/communication.interface';
import { SerialCommunication } from '../../shared/communication/serial-communication';
import { SocketCommunication } from '../../shared/communication/socket-communication';

export class ColdWalletCommunication {
  static create(type: CommunicationType, ui?: UserInterface): ICommunication {
    switch (type) {
      case CommunicationType.SERIAL:
        return new SerialCommunication(ui);
      case CommunicationType.TCP:
        return new SocketCommunication(ui);
    }
  }
}
