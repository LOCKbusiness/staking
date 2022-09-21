import { BaseCommunication } from './base-communication';
import { Message } from './message';
import { Serial } from './serial';

export abstract class BaseSerialCommunication extends BaseCommunication {
  private readonly serial: Serial;

  constructor(timeout: number = 5) {
    super(timeout);
    this.serial = new Serial();
    this.serial.onData((data: Message) => this.onResponse(data));
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
