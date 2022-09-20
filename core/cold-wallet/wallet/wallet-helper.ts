import { generateMnemonicWords } from '@defichain/jellyfish-wallet-mnemonic';
import { randomBytes } from 'crypto';
import { SecureSeed } from '../seed/secure-seed';
import { Util } from '../../shared/util';
import { ColdWallet } from './cold-wallet';

export class WalletHelper {
  static generate() {
    // generateMnemonicWords only allows for specific numbers
    // using ColdWallet.NEEDED_SEED_LENGTH doesn't work
    const seed = generateMnemonicWords(24, (numOfBytes) => {
      const bytes = randomBytes(numOfBytes);
      return Buffer.from(bytes);
    });
    SecureSeed.splitAndStore(seed);
  }

  static async restore(): Promise<ColdWallet> {
    const seed = await SecureSeed.read();
    return new ColdWallet(seed, Util.readNetwork());
  }
}
