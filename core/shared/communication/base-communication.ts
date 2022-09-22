import { randomUUID } from 'crypto';
import { Message } from './message';
import { Operation } from './operation';

export abstract class BaseCommunication {
  private readonly requests: Map<string, Message & { completed: (response: any) => void }>;

  constructor(private readonly timeout: number = 5) {
    this.requests = new Map();
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract send(message: Message): Promise<void>;
  abstract actOn(message: Message): Promise<Message | undefined>;

  async query<T, U>(operation: Operation, payload?: T): Promise<U> {
    const message: Message = {
      id: randomUUID(),
      operation: operation,
      payload: payload,
    };

    await this.send(message);

    return new Promise((resolve, reject) => {
      this.requests.set(message.id, { ...message, completed: resolve });

      // reject on timeout
      setTimeout(() => {
        if (this.requests.delete(message.id)) reject(new Error('Query timed out'));
      }, this.timeout * 1000);
    });
  }

  protected async onMessageReceived(message: Message): Promise<void> {
    const answer = await this.actOn(message);
    if (answer) {
      await this.send(answer);
    } else {
      this.onResponse(message);
    }
  }

  private onResponse(message: Message): void {
    const request = this.requests.get(message.id);
    if (!request) return console.error('Received unmatched response', message);

    request.completed(message.payload);
    this.requests.delete(message.id);
  }
}
