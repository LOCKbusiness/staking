import { Socket } from 'net';
import { UserInterface } from '../../cold-wallet/ui/user-interface';
import { BaseCommunication } from './base/base-communication';
import { Message } from './dto/message';

export class SocketCommunication extends BaseCommunication {
  private readonly port = 9000;

  private socketToServer?: Socket;

  constructor(ui?: UserInterface) {
    super(ui);
  }

  async connect(): Promise<void> {
    this.logger.info('trying to connect to', this.port);
    this.socketToServer = new Socket();
    this.socketToServer.connect(this.port);
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
    this.logger.debug('sending', message);
    this.socketToServer?.write(JSON.stringify(message));
  }
}
