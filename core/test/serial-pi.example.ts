import { exit } from "process";
import { Serial } from "./services/serial";
import { sleep } from "./services/util";

class App {
  private readonly serial: Serial;

  constructor() {
    this.serial = new Serial();
  }

  async run(): Promise<void> {
    await this.serial.open("/dev/serial0");
    this.serial.onData(console.log);

    while (true) {
      await this.serial.send({ message: "Pi to Mac!", success: true, date: new Date() });
      await sleep(1);
    }

    await this.serial.close();
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
