import GPIO from 'rpi-gpio';
import { debounceTime, filter, map, Observable, pairwise, Subject, switchMap } from 'rxjs';

export class Keypad {
  private readonly gpio = GPIO.promise;

  private readonly rowPins = [13, 22, 18, 12];
  private readonly colPins = [11, 15, 16];
  private readonly keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#'],
  ];

  private readonly $change = new Subject<boolean>();

  async connect() {
    // setup all row pins as inputs
    for (const pin of this.rowPins) {
      await this.gpio.setup(pin, 'in', 'rising');
    }

    // setup all col pins as outputs
    for (const pin of this.colPins) {
      await this.gpio.setup(pin, 'high');
    }

    // add listener
    GPIO.on('change', (c, v) => this.rowPins.includes(c) && this.$change.next(v));
  }

  async disconnect() {
    await this.gpio.destroy();
  }

  readonly onKeyPress: Observable<string> = this.$change.pipe(
    debounceTime(25),
    switchMap(() => this.readKey()),
    pairwise(),
    filter(([prev, curr]) => curr != null && curr !== prev),
    map(([_, curr]) => curr as string),
  );

  // --- HELPER METHODS --- //
  private async readKey(): Promise<string | undefined> {
    // find the active key
    let activeKey: string | undefined = undefined;
    for (let i = 0; i < this.colPins.length; i++) {
      const colPin = this.colPins[i];

      // enable col
      for (const pin of this.colPins) {
        await this.gpio.write(pin, colPin === pin);
      }

      // read row
      for (let j = 0; j < this.rowPins.length; j++) {
        const rowPin = this.rowPins[j];

        const isActive = await this.gpio.read(rowPin);
        if (isActive) activeKey = this.keys[j][i];
      }
    }

    // reset state
    for (const pin of this.colPins) {
      await this.gpio.write(pin, true);
    }

    return activeKey;
  }
}
