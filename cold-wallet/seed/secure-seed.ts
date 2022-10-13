import Config from '../../shared/config';
import { Shamir } from '../../shared/crypto/shamir';
import { Util } from '../../shared/util';
import { Encryption } from '../../shared/crypto/encryption';

const USB_COUNT = 8;

export class SecureSeed {
  static async splitAndStore(seed: string[], code: string): Promise<void> {
    // generate shamir shares
    const secret = seed.join(' ');
    const shares = Shamir.split(secret, Config.wallet.seed.shareCount, Config.wallet.seed.thresholdCount);

    // encrypt and write to file
    shares
      .map((share) => (code ? Encryption.encrypt(share, code) : share))
      .forEach((share, i) => this.writeShamirShare(i, share));
  }

  static async read(code: string): Promise<string[]> {
    // read the shares from file and decrypt
    const shares = [];
    for (let i = 0; i < USB_COUNT && shares.length < Config.wallet.seed.thresholdCount; i++) {
      const share = this.readShamirShare(i);
      if (share) shares.push(code ? Encryption.decrypt(share, code) : share);
    }

    // recreate the seed
    if (shares.length < Config.wallet.seed.thresholdCount)
      throw new Error('Failed to read seed, not enough shamir shares found');
    const seed = Shamir.join(shares);

    // sanity check
    if (seed.match(/[^a-z\s]/)) throw new Error(`Invalid seed phrase: ${seed}`);

    return seed.split(' ');
  }

  // --- HELPER METHODS --- //

  private static writeShamirShare(share: number, content: string) {
    const filePath = Config.wallet.seed.writeFilePath(share);

    Util.ensureDir(filePath);
    Util.writeFileRaw(filePath, content);
  }

  private static readShamirShare(share: number): string | undefined {
    try {
      return Util.readFileRaw(Config.wallet.seed.readFilePath(share));
    } catch (_) {
      return undefined;
    }
  }
}
