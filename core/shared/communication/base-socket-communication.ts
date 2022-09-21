import { Socket } from 'net';
import { Logger } from '../logger';
import { BaseCommunication } from './base-communication';
import { Message } from './message';
import { Operation } from './operation';

const operationToAnswer = [Operation.REQUEST_API];

export abstract class BaseSocketCommunication extends BaseCommunication {
  private readonly logger = new Logger('Socket Comm');

  private socketToServer?: Socket;

  abstract connectToPort(): number;
  abstract receivedMessage(message: Message): Promise<Message>;

  async connect(): Promise<void> {
    this.logger.info('trying to connect to', this.connectToPort());
    this.socketToServer = new Socket();
    this.socketToServer.connect(this.connectToPort());
    this.socketToServer.addListener('data', async (data) => {
      const message = JSON.parse(String(data)) as Message;
      this.logger.info('received', message);
      if (operationToAnswer.includes(message.operation)) {
        const answer = await this.receivedMessage(message);
        await this.send(answer);
      } else {
        this.onResponse(message);
      }
    });
  }

  async disconnect(): Promise<void> {
    this.logger.info('disconnecting');
    this.socketToServer?.destroy();
    this.socketToServer = undefined;
  }

  async send(message: Message): Promise<void> {
    this.logger.info('sending\n', message);
    this.socketToServer?.write(JSON.stringify(message));
  }
}
