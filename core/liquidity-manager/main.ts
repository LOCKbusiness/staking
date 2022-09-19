import { exit } from 'process';
import { config } from 'dotenv';
import { Api } from '../shared/api';
import { Node } from '../shared/node';

class App {
  private readonly api: Api;
  private readonly node: Node;

  constructor() {
    config();

    this.api = new Api();
    this.node = new Node();
  }

  async run(): Promise<void> {
    await this.node.init();
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
