import { Subject } from 'rxjs';
import usb, { Device } from 'usb-detection';

export enum UsbChangeType {
  ADD = 'Add',
  REMOVE = 'Remove',
}

export interface UsbChange {
  type: UsbChangeType;
  device: Device;
}

export class Usb {
  private readonly $change = new Subject<UsbChange>();

  connect() {
    usb.startMonitoring();

    usb.on('add', (device) => this.change(UsbChangeType.ADD, device));
    usb.on('remove', (device) => this.change(UsbChangeType.REMOVE, device));
  }

  disconnect() {
    usb.stopMonitoring;
  }

  readonly onChange = this.$change.asObservable();

  // --- HELPER METHODS --- //
  private change(type: UsbChangeType, device: Device) {
    this.$change.next({ type, device });
  }
}
