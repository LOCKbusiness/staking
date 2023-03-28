import { exit } from 'process';
import { Shamir } from '../cold-wallet/crypto/shamir';
import { Util } from '../shared/util';
import { SecureSeed } from '../cold-wallet/wallet/secure-seed';

/**
 * Recover a seed from physical backup
 */

class App {
  async run(): Promise<void> {
    const share1 = await Util.getCliInput('Please enter a seed share:', false);
    const share2 = await Util.getCliInput('Please enter another seed share:', false);

    const seed = Shamir.join([share1, share2]);
    if (!Shamir.isValid(seed)) {
      throw new Error(`Invalid seed phrase: ${seed}`);
    }

    const code = await Util.getCliInput('Please enter the new pass code:', true);
    if (code.match(/[^0-9]/)) throw new Error('Only numbers are allowed');
    console.log('OK');

    await SecureSeed.splitAndStore(seed.split(' '), code);
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
