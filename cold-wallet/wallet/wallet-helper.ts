import { generateMnemonicWords } from '@defichain/jellyfish-wallet-mnemonic';
import { randomBytes } from 'crypto';
import { SecureSeed } from '../seed/secure-seed';
import { Util } from '../../shared/util';
import { ColdWallet } from './cold-wallet';
import Config from '../../shared/config';

export class WalletHelper {
  static async generate(): Promise<ColdWallet> {
    const seed = generateMnemonicWords(Config.wallet.seed.length, randomBytes);
    await SecureSeed.splitAndStore(seed);

    return new ColdWallet(seed, Util.readNetwork());
  }

  static async restore(): Promise<ColdWallet> {
    const seed = await SecureSeed.read();
    return new ColdWallet(seed, Util.readNetwork());
  }
}
