import { exit } from 'process';
import { Logger } from '../shared/logger';
import { Util } from '../shared/util';
import { ColdWallet } from './wallet/cold-wallet';
import { WalletHelper } from './wallet/wallet-helper';

const ADDRESS_COUNT = 1000;

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
    this.logger.info('Generating new wallet ...');
    const wallet = await WalletHelper.generate();
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

  private async generateAddresses(wallet: ColdWallet): Promise<OwnerAddress[]> {
    const walletName = await wallet.getName();
    const addresses: OwnerAddress[] = [];

    for (let i = 0; i < ADDRESS_COUNT; i++) {
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
