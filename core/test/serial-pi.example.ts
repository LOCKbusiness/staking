import { exit } from 'process';
import { Serial } from '../shared/communication/serial';
import { Util } from '../shared/util';

class App {
  private readonly serial: Serial;

  constructor() {
    this.serial = new Serial();
  }

  async run(): Promise<void> {
    await this.serial.open('/dev/serial0');
    this.serial.onData(console.log);

    for (;;) {
      await this.serial.send({ message: 'Pi to Mac!', success: true, date: new Date() });
      await Util.sleep(1);
    }

    await this.serial.close();
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
