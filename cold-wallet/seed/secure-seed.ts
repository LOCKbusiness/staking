import Config from '../../shared/config';
import { Logger } from '../../shared/logger';

export class SecureSeed {
  private static logger = new Logger('Secure Seed');

  static async splitAndStore(seed: string[]): Promise<void> {
    this.logger.info('"safely" secured following seed :D');
    this.logger.info('', seed);
  }

  static async read(): Promise<string[]> {
    return Config.wallet.seed?.split(',') ?? [];
  }
}
