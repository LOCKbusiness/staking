import { Keypad } from './keypad';
import { Color, Led } from './led';

const ENTER_KEY = '#';

export class KeyInput {
  private readonly led: Led;
  private readonly keypad: Keypad;

  private resolve?: (value: string | PromiseLike<string>) => void;
  private line = '';

  constructor(led: Led) {
    this.led = led;
    this.keypad = new Keypad();
    this.keypad.onKeyPress.subscribe((key) => this.onKeyPress(key));
  }

  async connect(): Promise<void> {
    await this.keypad.connect();
  }

  async disconnect(): Promise<void> {
    await this.keypad.disconnect();
  }

  async readLine(timeout?: number): Promise<string> {
    if (this.resolve) throw new Error('Reading is already in progress');

    return new Promise((resolve, reject) => {
      this.resolve = resolve;

      // reject on timeout
      if (timeout) {
        setTimeout(() => {
          this.clearState();

          reject(new Error('Timeout'));
        }, timeout * 1000);
      }
    });
  }

  private onKeyPress(key: string): void {
    if (!this.resolve) return;

    this.led.flash(Color.GREEN);

    if (key === ENTER_KEY) {
      this.resolve(this.line);
      this.clearState();
    } else {
      this.line += key;
    }
  }

  private clearState() {
    this.resolve = undefined;
    this.line = '';
  }
}
