import { MainNet, Network, TestNet } from '@defichain/jellyfish-network';
import readline from 'readline';
import { Writable } from 'stream';
import Config from './config';

type KeyType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export class Util {
  static sleep(seconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }

  static poll<T>(
    action: () => Promise<T | undefined>,
    verify: (result: T | undefined) => boolean,
    interval: number,
    timeout: number,
    catchErrors?: boolean,
  ): Promise<T | undefined> {
    return new Promise(async (resolve, reject) => {
      let abort = false;

      // action/error handling
      const doAction = async () =>
        await action().catch((e) => {
          if (catchErrors) return undefined;

          abort = true;
          reject(e);
        });

      // set timer
      const timer = setTimeout(() => (abort = true), timeout * 1000);

      // poll
      let result = await doAction();
      while (!abort && !verify(result)) {
        await this.sleep(interval);
        result = await doAction();
      }

      clearTimeout(timer);
      return resolve(result);
    });
  }

  static async retry<T>(action: () => Promise<T>, tryCount = 3, delay = 0): Promise<T> {
    try {
      return await action();
    } catch (e) {
      if (tryCount > 1) {
        await this.sleep(delay);
        return this.retry(action, tryCount - 1, delay);
      }

      throw e;
    }
  }

  // --- MATH UTIL --- //
  static round(number: number, decimals: number): number {
    return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  static sum(list: number[]): number {
    return list.reduce((prev, curr) => prev + curr, 0);
  }

  static sumObj<T>(list: T[], key: KeyType<T, number>): number {
    return this.sum(list.map((i) => i[key] as unknown as number));
  }

  static avg(list: number[]): number {
    return this.sum(list) / list.length;
  }

  // --- CLI UTIL --- //
  static getCliInput(question: string, isPassword = false): Promise<string> {
    return new Promise((resolve) => {
      let muted = false;
      const ui = readline.createInterface({
        input: process.stdin,
        output: new Writable({
          write: (chunk, encoding, callback) => {
            if (!muted) process.stdout.write(chunk, encoding);
            callback();
          },
        }),
        terminal: true,
      });
      ui.question(question + ' ', (val) => {
        ui.close();
        resolve(val);
      });
      muted = isPassword;
    });
  }

  // --- JELLYFISH UTIL --- //
  static readNetwork(): Network {
    const chainNetwork = Config.defichain.network;
    switch (chainNetwork?.toLowerCase()) {
      case 'mainnet':
        return MainNet;
      default:
        return TestNet;
    }
  }
}
