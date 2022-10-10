import Config from '../../shared/config';
import { Shamir } from '../../shared/shamir';
import { Util } from '../../shared/util';

export class SecureSeed {
  static async splitAndStore(seed: string[]): Promise<void> {
    // generate shamir shares
    const secret = seed.join(' ');
    const shares = Shamir.split(secret, Config.wallet.seed.shareCount, Config.wallet.seed.thresholdCount);

    // write to file
    shares.forEach((share, i) => Util.writeFileRaw(Config.wallet.seed.fileName(i), share));
  }

  static async read(): Promise<string[]> {
    // read the shares from file
    const shares = [];
    for (let i = 0; i < Config.wallet.seed.shareCount && shares.length < Config.wallet.seed.thresholdCount; i++) {
      const share = this.readShamirShare(i);
      if (share) shares.push(share);
    }

    // recreate the seed
    if (shares.length < Config.wallet.seed.thresholdCount)
      throw new Error('Failed to read seed, not enough shamir shares found');
    const seed = Shamir.join(shares);

    return seed.split(' ');
  }

  // --- HELPER METHODS --- //
  private static readShamirShare(share: number): string | undefined {
    try {
      return Util.readFileRaw(Config.wallet.seed.fileName(share));
    } catch (_) {
      return undefined;
    }
  }
}
