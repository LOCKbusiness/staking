import { Socket } from 'net';
import { BaseCommunication } from './base-communication';
import { Message } from './message';

export abstract class BaseSocketCommunication extends BaseCommunication {
  private socketToServer?: Socket;

  abstract connectToPort(): number;

  async connect(): Promise<void> {
    this.logger.info('trying to connect to', this.connectToPort());
    this.socketToServer = new Socket();
    this.socketToServer.connect(this.connectToPort());
    this.socketToServer.addListener('data', async (data) => {
      const message = JSON.parse(String(data)) as Message;
      this.logger.debug('received', message);
      await this.onMessageReceived(message);
    });
  }

  async disconnect(): Promise<void> {
    this.logger.info('disconnecting');
    this.socketToServer?.destroy();
    this.socketToServer = undefined;
  }

  async send(message: Message): Promise<void> {
    this.logger.debug('sending\n', message);
    this.socketToServer?.write(JSON.stringify(message));
  }
}
