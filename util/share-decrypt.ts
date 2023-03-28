import { exit } from 'process';
import Config from '../shared/config';
import { Encryption } from '../cold-wallet/crypto/encryption';
import { Util } from '../shared/util';

/**
 * Decrypt a seed share
 */

class App {
  async run(): Promise<void> {
    const code = await Util.getCliInput('Please enter the pass code:', true);
    const share = Util.readFileRaw(Config.wallet.seed.readFilePath(0));
    const decryptedShare = code ? Encryption.decrypt(share, code) : share;

    if (decryptedShare.match(/^\d/)) {
      console.log('OK');
      console.log('Shamir share:', decryptedShare);
    } else {
      console.log('NOK');
    }
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
