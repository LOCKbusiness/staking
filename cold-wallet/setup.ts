import { exit } from 'process';
import Config from '../shared/config';
import { Logger } from '../shared/logger';
import { Util } from '../shared/util';
import { ColdWallet } from './wallet/cold-wallet';
import { WalletHelper } from './wallet/wallet-helper';

interface OwnerAddress {
  wallet: string;
  index: number;
  address: string;
}

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
    this.logger.info('Generating new wallet ...');
    const wallet = await WalletHelper.generate(code);
    wallet.initialize();
    this.logger.info(`   => Wallet '${await wallet.getName()}' initialized`);

    // generate owner addresses
    this.logger.info('Generating owner addresses ...');
    const fileName = `owner.json`;
    const addresses = await this.generateAddresses(wallet);
    Util.writeFile(fileName, addresses);
    this.logger.info(`   => Owner address list written to file '${fileName}'`);

    this.logger.info(`=== Wallet '${await wallet.getName()}' setup complete ===`);
  }

  // --- HELPER METHODS --- //
  private async generateAddresses(wallet: ColdWallet): Promise<OwnerAddress[]> {
    const walletName = await wallet.getName();
    const addresses: OwnerAddress[] = [];

    for (let i = 0; i < Config.wallet.addressCount; i++) {
      const address = await wallet.getAddress(i);
      addresses.push({ wallet: walletName, index: i, address: address });
    }

    return addresses;
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
