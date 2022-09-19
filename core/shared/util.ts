import readline from 'readline';
import { Writable } from 'stream';

export function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

export function poll<T>(
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
      await sleep(interval);
      result = await doAction();
    }

    clearTimeout(timer);
    return resolve(result);
  });
}

export async function retry<T>(action: () => Promise<T>, tryCount = 3, delay = 0): Promise<T> {
  try {
    return await action();
  } catch (e) {
    if (tryCount > 1) {
      await sleep(delay);
      return retry(action, tryCount - 1, delay);
    }

    throw e;
  }
}

// --- MATH UTIL --- //
export function round(number: number, decimals: number): number {
  return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// --- CLI UTIL --- //
export function getCliInput(question: string, isPassword = false): Promise<string> {
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
