import { exit } from 'process';
import { WalletHelper } from '../cold-wallet/wallet/wallet-helper';
import Config from '../shared/config';
import { Util } from '../shared/util';

class App {
  async run(): Promise<void> {
    const code = await Util.getCliInput('Please enter the pass code:', true);
    console.log();

    const wallet = await WalletHelper.restore(code);
    wallet.initialize();

    const addresses = await wallet.getAddresses(0, Config.wallet.addressCount);

    const fileName = 'owner.json';
    Util.writeFile(fileName, addresses);
    console.log(`Owner address list written to file '${fileName}'`);
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
