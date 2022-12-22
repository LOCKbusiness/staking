import { randomUUID } from 'crypto';
import { Logger } from '../../logger';
import { ICommunication, Subscriber } from './communication.interface';
import { Message } from '../dto/message';
import { Operation } from '../dto/operation';
import { UserInterface } from '../../../cold-wallet/ui/user-interface';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Request = { completed: (response: any) => void; failed: (error: any) => void };

export abstract class BaseCommunication implements ICommunication {
  private readonly requests: Map<string, Request>;
  private readonly subscribers: Map<Operation, Subscriber>;
  protected readonly logger = new Logger('Communication');

  constructor(private readonly ui?: UserInterface, private readonly timeout: number = 5) {
    this.requests = new Map();
    this.subscribers = new Map();

    // setup ping response
    this.on(Operation.PING, () => 'Pong');
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

    return this.waitForResponse(message.id);
  }

  private async waitForResponse<T>(id: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: Request = { completed: resolve, failed: reject };
      this.requests.set(id, request);

      // reject on timeout
      setTimeout(() => this.onFail(id, new Error('Query timed out'), request), this.timeout * 1000);
    });
  }

  protected async onMessageReceived(message: Message): Promise<void> {
    await this.ui?.showActivity();

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
        this.logger.error(`exception during message handling:`, e);
      }
    }
  }

  private onResponse(message: Message, request: Request): void {
    if (this.requests.delete(message.id)) request.completed(message.payload);
  }

  private onFail(id: string, error: Error, request: Request): void {
    if (this.requests.delete(id)) request.failed(error);
  }

  protected cancelRequests(): void {
    for (const [id, request] of this.requests) {
      this.onFail(id, new Error('Query cancelled'), request);
    }
  }
}
