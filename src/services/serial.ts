import { SerialPort } from "serialport";
import { sleep } from "./util";

export class Serial {
  private serial: SerialPort = {} as SerialPort;
  private data: string = "";

  open(path: string, baudRate: number = 115200): Promise<void> {
    this.serial = new SerialPort({ path, baudRate });

    return new Promise(async (resolve, reject) => {
      for (let i = 0; i < 10 && !this.serial.isOpen; i++) {
        await sleep(0.1);
      }
      return this.serial.isOpen ? resolve() : reject(new Error("Failed to open serial port"));
    });
  }

  send(message: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.serial.write(JSON.stringify(message) + "\n", "utf8", (e) => (e ? reject(e) : resolve()));
    });
  }

  onData<T>(cb: (data: T) => void) {
    this.checkOpen();

    this.serial.on("data", (message: Buffer) => {
      try {
        this.data += message.toString("utf-8");
        if (this.data.endsWith("\n")) {
          cb(JSON.parse(this.data));
          this.data = "";
        }
      } catch (e) {
        console.error(`Invalid message: ${message}`);
      }
    });
  }

  close(): Promise<void> {
    this.checkOpen();

    return new Promise((resolve, reject) => {
      this.serial.close((e) => (e ? reject(e) : resolve()));
    });
  }

  private checkOpen() {
    if (!this.serial.isOpen) throw new Error("Serial port not open");
  }
}
