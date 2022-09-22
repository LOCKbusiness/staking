import { BaseCommunication } from './base-communication';
import { Message } from './message';
import { Serial } from './serial';

export abstract class BaseSerialCommunication extends BaseCommunication {
  private readonly serial: Serial;

  constructor(timeout = 5) {
    super(timeout);
    this.serial = new Serial();
    this.serial.onData(async (data: Message) => await this.onMessageReceived(data));
  }

  abstract getPath(): string;

  connect(): Promise<void> {
    return this.serial.open(this.getPath());
  }

  disconnect(): Promise<void> {
    return this.serial.close();
  }

  send(message: Message): Promise<void> {
    return this.serial.send(message);
  }
}
