import { readdirSync } from 'fs';
import { SerialPort } from 'serialport';
import { Util } from '../util';
import { BaseCommunication } from './base/base-communication';
import { Message } from './dto/message';

export class SerialCommunication extends BaseCommunication {
  private readonly deviceBasePath = '/dev';
  private readonly possibleDevices = ['serial0', 'cu.usbserial'];

  private serial: SerialPort = {} as SerialPort;
  private data = '';

  constructor(private readonly baudRate = 115200, timeout = 600) {
    super(timeout);
  }

  async connect(): Promise<void> {
    const devices = readdirSync(this.deviceBasePath);
    const device = devices.find((d) => this.possibleDevices.some((pd) => d.startsWith(pd)));
    if (!device) throw new Error('No serial device found');

    this.serial = new SerialPort({ path: `${this.deviceBasePath}/${device}`, baudRate: this.baudRate });

    for (let i = 0; i < 10 && !this.serial.isOpen; i++) {
      await Util.sleep(0.1);
    }

    if (!this.serial.isOpen) throw new Error('Failed to open serial port');

    // register message handler
    this.serial.on('data', async (message: Buffer) => {
      try {
        this.data += message.toString('utf-8');
        if (this.data.endsWith('\n')) {
          this.onMessageReceived(JSON.parse(this.data));
          this.data = '';
        }
      } catch (e) {
        this.logger.error(`invalid message:`, message);
        this.serial.flush();
        this.data = '';
      }
    });
  }

  disconnect(): Promise<void> {
    if (!this.serial.isOpen) return Promise.resolve();

    return new Promise((resolve, reject) => {
      this.serial.close((e) => (e ? reject(e) : resolve()));
    });
  }

  send(message: Message): Promise<void> {
    return new Promise((resolve, reject) => {
      this.serial.write(JSON.stringify(message) + '\n', 'utf8', (e) => (e ? reject(e) : resolve()));
    });
  }

  // --- HELPER METHODS --- //
  private checkOpen() {
    if (!this.serial.isOpen) throw new Error('Serial port not open');
  }
}
