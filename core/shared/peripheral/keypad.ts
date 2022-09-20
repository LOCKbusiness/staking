import GPIO from 'rpi-gpio';
import { debounceTime, filter, map, Subject, switchMap } from 'rxjs';

export class Keypad {
  private readonly gpio = GPIO.promise;

  private readonly rowPins = [1, 2, 3, 4]; // TODO: select pins
  private readonly colPins = [5, 6, 7];
  private readonly keys = [
    ['1', '2', '3'],
    ['4', '5', '5'],
    ['7', '8', '9'],
    ['*', '0', '#'],
  ];

  private readonly $change = new Subject<boolean>();

  private readInProgress = false;

  async connect() {
    // TODO: verify if pull up or down

    // setup all row pins as inputs
    for (const pin of this.rowPins) {
      await this.gpio.setup(pin, 'in', 'rising');
    }

    // setup all col pins as outputs
    for (const pin of this.colPins) {
      await this.gpio.setup(pin, 'high');
    }

    // add listener
    GPIO.on('change', (_, v) => this.$change.next(v));
  }

  async disconnect() {
    await this.gpio.destroy();
  }

  readonly onKeyPress = this.$change.pipe(
    debounceTime(10),
    switchMap(() => this.readKey()),
    filter((v) => v != null),
    map((v) => v as string),
  );

  // --- HELPER METHODS --- //
  private async readKey(): Promise<string | undefined> {
    // readInProgress can be removed?
    if (this.readInProgress) return;
    this.readInProgress = true;

    // find the active key
    let activeKey: string | undefined = undefined;
    for (let i = 0; i < this.colPins.length; i++) {
      const colPin = this.colPins[i];

      // enable col
      for (const pin of this.colPins) {
        await this.gpio.write(colPin, colPin === pin);
      }

      // read row
      for (let j = 0; j < this.rowPins.length; j++) {
        const rowPin = this.rowPins[j];

        const isActive = await this.gpio.read(rowPin);
        if (isActive) activeKey = this.keys[i][j];
      }
    }

    // reset state
    for (const pin of this.colPins) {
      await this.gpio.write(pin, true);
    }

    this.readInProgress = false;

    return activeKey;
  }
}
