import { exit } from 'process';
import { Util } from '../shared/util';
import { SecureSeed } from '../cold-wallet/wallet/secure-seed';

/**
 * Create new seed shares of the same seed (e.g. to change the pass code, or to recover a share part)
 */

class App {
  async run(): Promise<void> {
    const oldCode = await Util.getCliInput('Please enter the pass code:', true);
    if (oldCode.match(/[^0-9]/)) throw new Error('Only numbers are allowed');

    const seed = await SecureSeed.read(oldCode);

    console.log('OK');

    const newCode = await Util.getCliInput(
      'Please enter the new pass code (numbers only, default: no pass code):',
      true,
    );
    if (newCode.match(/[^0-9]/)) throw new Error('Only numbers are allowed');
    console.log('OK');

    await SecureSeed.splitAndStore(seed, newCode);
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
