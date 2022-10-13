import { Server, Socket } from 'net';
import { BaseCommunication } from './base/base-communication';
import { Message } from './dto/message';

export class ServerCommunication extends BaseCommunication {
  private readonly server: Server;
  private connectedSocket?: Socket;

  constructor(private readonly port: number) {
    super();
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
    this.logger.debug('sending\n', message);
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
