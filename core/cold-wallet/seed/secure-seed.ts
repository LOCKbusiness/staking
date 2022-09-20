export class SecureSeed {
  static async splitAndStore(seed: string[]): Promise<void> {
    console.log('"safely" secured following seed :D');
    console.log(seed);
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
