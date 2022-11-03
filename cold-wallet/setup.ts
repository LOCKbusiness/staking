import { exit } from 'process';
import Config from '../shared/config';
import { Logger } from '../shared/logger';
import { Util } from '../shared/util';
import { WalletHelper } from './wallet/wallet-helper';

class App {
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger('Cold Wallet Setup');
  }

  async run(): Promise<void> {
    // get the pass code for seed encryption
    const code = await Util.getCliInput('Please enter the seed pass code (numbers only, default: no pass code):', true);
    if (code.match(/[^0-9]/)) throw new Error('Only numbers are allowed');
    console.log('OK');

    // generate new wallet
    this.logger.info('generating new wallet ...');
    const wallet = await WalletHelper.generate(code);
    wallet.initialize();
    this.logger.info(`   => wallet '${await wallet.getName()}' initialized`);

    // generate owner addresses
    this.logger.info('generating owner addresses ...');
    const addresses = await wallet.getAddresses(0, Config.wallet.addressCount);

    // write to file
    const fileName = `owner.json`;
    Util.writeFile(fileName, addresses);
    this.logger.info(`   => owner address list written to file '${fileName}'`);

    this.logger.info(`=== Wallet '${await wallet.getName()}' setup complete ===`);
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
