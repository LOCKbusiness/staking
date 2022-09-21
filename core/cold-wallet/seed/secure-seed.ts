import { Logger } from '../../shared/logger';

export class SecureSeed {
  private static logger = new Logger('Secure Seed');

  static async splitAndStore(seed: string[]): Promise<void> {
    this.logger.info('"safely" secured following seed :D');
    this.logger.info('', seed);
  }

  static async read(): Promise<string[]> {
    return [
      'lesson',
      'father',
      'slam',
      'jelly',
      'toilet',
      'banana',
      'girl',
      'eye',
      'track',
      'swamp',
      'virtual',
      'execute',
      'attitude',
      'sport',
      'tip',
      'churn',
      'arrive',
      'canal',
      'firm',
      'swarm',
      'chalk',
      'benefit',
      'stock',
      'economy',
    ];
  }
}
