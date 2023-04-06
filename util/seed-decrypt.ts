import { exit } from 'process';
import { Shamir } from '../cold-wallet/crypto/shamir';
import { Util } from '../shared/util';

/**
 * Decrypt and display a seed from physical backup
 */

class App {
  async run(): Promise<void> {
    const share1 = await Util.getCliInput('Please enter a seed share:', false);
    const share2 = await Util.getCliInput('Please enter another seed share:', false);

    const seed = Shamir.join([share1, share2]);
    if (!Shamir.isValid(seed)) {
      throw new Error(`Invalid seed phrase: ${seed}`);
    }

    const proceed = await Util.getCliInput('This will display the unencrypted seed! Ready to continue? (y/n)', false);
    if (proceed === 'y') {
      console.log(seed);
    }
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
