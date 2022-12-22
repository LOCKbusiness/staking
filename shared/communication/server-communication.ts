import { Server, Socket } from 'net';
import { UserInterface } from '../../cold-wallet/ui/user-interface';
import { BaseCommunication } from './base/base-communication';
import { Message } from './dto/message';

export class ServerCommunication extends BaseCommunication {
  private readonly port = 9000;
  private readonly server: Server;

  private connectedSocket?: Socket;

  constructor(ui?: UserInterface) {
    super(ui);
    this.server = new Server((socket) => {
      this.onSocketConnected(socket);
    });
  }

  async connect(): Promise<void> {
    this.logger.info('listening on', this.port);
    this.server.listen(this.port);
  }

  async disconnect(): Promise<void> {
    this.logger.info('disconnecting');
    this.connectedSocket?.destroy();
    this.connectedSocket = undefined;
  }

  async send(message: Message): Promise<void> {
    this.logger.debug('sending', message);
    this.connectedSocket?.write(JSON.stringify(message));
  }

  private onSocketConnected(socket: Socket) {
    this.logger.info('socket connected');
    socket.addListener('data', async (data) => {
      await this.onMessageReceived(JSON.parse(String(data)) as Message);
    });
    this.connectedSocket = socket;
  }
}
