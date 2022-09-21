import { Server, Socket } from 'net';
import { Logger } from '../logger';
import { BaseCommunication } from './base-communication';
import { Message } from './message';

export abstract class BaseServerCommunication extends BaseCommunication {
  protected readonly logger: Logger;
  private readonly server: Server;
  private connectedSocket?: Socket;

  constructor() {
    super();
    this.logger = new Logger('Server Comm');
    this.server = new Server((socket) => {
      this.onSocketConnected(socket);
    });
  }

  abstract listenOnPort(): number;
  abstract onDataReceived(data: any): Promise<[boolean, Message]>;

  async connect(): Promise<void> {
    this.logger.info('listening on', this.listenOnPort());
    this.server.listen(this.listenOnPort());
  }

  async disconnect(): Promise<void> {
    this.logger.info('disconnecting');
    this.connectedSocket?.destroy();
    this.connectedSocket = undefined;
  }

  async send(message: Message): Promise<void> {
    this.logger.info('sending\n', message);
    this.connectedSocket?.write(JSON.stringify(message));
  }

  private onSocketConnected(socket: Socket) {
    this.logger.info('socket connected');
    socket.addListener('data', async (data) => {
      const [shouldSend, message] = await this.onDataReceived(data);
      if (shouldSend) this.send(message);
      else this.onResponse(message);
    });
    this.connectedSocket = socket;
  }
}
