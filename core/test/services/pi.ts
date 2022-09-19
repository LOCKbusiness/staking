import { randomUUID } from "crypto";
import { Serial } from "./serial";

export enum Operation {
  TEST = "Test",
}

export interface Message {
  id: string;
  operation: Operation;
  payload: any;
}

export class Pi {
  private readonly serial: Serial;
  private readonly requests: Map<string, Message & { completed: (response: any) => void }>;

  constructor(private readonly timeout: number = 5) {
    this.serial = new Serial();
    this.requests = new Map();

    this.serial.onData((data: Message) => this.onResponse(data));
  }

  async connect(path: string = "/dev/cu.usbserial-01434108"): Promise<void> {
    await this.serial.open(path);
  }

  async disconnect(): Promise<void> {
    await this.serial.close();
  }

  async query<T, U>(operation: Operation, payload: T): Promise<U> {
    const message: Message = {
      id: randomUUID(),
      operation: operation,
      payload: payload,
    };

    await this.serial.send(message);

    return new Promise((resolve, reject) => {
      this.requests.set(message.id, { ...message, completed: resolve });

      // reject on timeout
      setTimeout(() => {
        if (this.requests.delete(message.id)) reject(new Error("Query timed out"));
      }, this.timeout * 1000);
    });
  }

  private onResponse(message: Message): void {
    const request = this.requests.get(message.id);
    if (!request) return console.error("Received unmatched response", message);

    request.completed(message.payload);
    this.requests.delete(message.id);
  }
}
