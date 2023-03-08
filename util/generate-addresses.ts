import { exit } from 'process';
import { WalletHelper } from '../cold-wallet/wallet/wallet-helper';
import { Util } from '../shared/util';

class App {
  async run(): Promise<void> {
    const addressCount = +(process.argv[2] ?? 0);
    if (!addressCount) throw new Error('Missing address count argument');

    const code = await Util.getCliInput('Please enter the pass code:', true);
    console.log();

    const wallet = await WalletHelper.restore(code);
    await wallet.initialize();

    const addresses = await wallet.getAddresses(0, addressCount);

    const fileName = 'owner.json';
    Util.writeFile(fileName, addresses);
    console.log(`Owner address list written to file '${fileName}'`);
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
