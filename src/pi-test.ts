import { exit } from "process";
import { Operation, Pi } from "./services/pi";

class App {
  private readonly pi: Pi;

  constructor() {
    this.pi = new Pi();
  }

  async run(): Promise<void> {
    await this.pi.connect();
    await this.pi.query(Operation.TEST, { msg: "Request" }).then(console.log);
    await this.pi.disconnect();
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
