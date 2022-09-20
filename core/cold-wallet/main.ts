import { config } from 'dotenv';
import { exit } from 'process';
import { WalletHelper } from './wallet/wallet-helper';

class App {
  async run(): Promise<void> {
    config();

    const wallet = await WalletHelper.restore();
    wallet.initialize();
    console.log(await wallet.getAddress());
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
