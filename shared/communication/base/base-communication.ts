import { randomUUID } from 'crypto';
import { Logger } from '../../logger';
import { ICommunication, Subscriber } from './communication.interface';
import { Message } from '../dto/message';
import { Operation } from '../dto/operation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Request = Message & { completed: (response: any) => void };

export abstract class BaseCommunication implements ICommunication {
  private readonly requests: Map<string, Request>;
  private readonly subscribers: Map<Operation, Subscriber>;
  protected readonly logger = new Logger('Communication');

  constructor(private readonly timeout: number = 5) {
    this.requests = new Map();
    this.subscribers = new Map();
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract send(message: Message): Promise<void>;

  on(operation: Operation, subscriber: Subscriber) {
    this.subscribers.set(operation, subscriber);
  }

  remove(operation: Operation): boolean {
    return this.subscribers.delete(operation);
  }

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
    const request = this.requests.get(message.id);
    if (request) {
      this.onResponse(message, request);
    } else {
      const actOn = this.subscribers.get(message.operation);
      try {
        const payload = await actOn?.(message.payload);
        if (payload) {
          await this.send({ ...message, payload });
        }
      } catch (e) {
        this.logger.error(`Exception: ${e}`);
      }
    }
  }

  private onResponse(message: Message, request: Request): void {
    request.completed(message.payload);
    this.requests.delete(message.id);
  }
}
