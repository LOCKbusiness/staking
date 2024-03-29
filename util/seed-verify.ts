import { exit } from 'process';
import Config from '../shared/config';
import { Encryption } from '../cold-wallet/crypto/encryption';
import { Shamir } from '../cold-wallet/crypto/shamir';
import { Util } from '../shared/util';

/**
 * Verify a seed completely (all share combinations)
 */

class App {
  async run(): Promise<void> {
    const code = await Util.getCliInput('Please enter the pass code:', true);

    // read shares
    const shares: string[] = [];
    for (let i = 0; i < Config.wallet.seed.shareCount; i++) {
      const share = Util.readFileRaw(Config.wallet.seed.readFilePath(i));
      shares.push(code ? Encryption.decrypt(share, code) : share);
    }

    const shareCombinations = this.getPossibleCombinations(shares, Config.wallet.seed.thresholdCount);
    for (const combination of shareCombinations) {
      const seed = Shamir.join(combination);
      if (!Shamir.isValid(seed)) {
        throw new Error(`Invalid share combination found`);
      }
    }

    console.log('OK');
  }

  private getPossibleCombinations(list: string[], combinationSize: number): string[][] {
    if (combinationSize === 1) return list.map((i) => [i]);

    const combinations = this.getPossibleCombinations(list, combinationSize - 1);

    return list
      .map((item) => combinations.filter((c) => !c.includes(item)).map((c) => [item].concat(c)))
      .reduce((prev, curr) => prev.concat(curr), []);
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
