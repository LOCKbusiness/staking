import GPIO from 'rpi-gpio';
import { debounceTime, Subject } from 'rxjs';
import { KeyInput } from './key-input';
import { Color, Led } from './led';

export class AlarmSystem {
  private readonly gpio = GPIO.promise;

  private readonly alarmPin = 0; // TODO
  private readonly powerPin = 0; // TODO

  private readonly $change = new Subject<boolean>();

  private hasAlarm = false;

  constructor(private readonly led: Led, private readonly input: KeyInput) {}

  async connect() {
    await this.gpio.setup(this.alarmPin, 'in', 'both');
    await this.gpio.setup(this.powerPin, 'high');

    // add listener
    GPIO.on('change', (c, v) => c === this.alarmPin && this.$change.next(v));
    this.$change.pipe(debounceTime(10)).subscribe((v) => v && void this.onAlarm());
  }

  async disconnect() {
    await this.gpio.destroy();
  }

  // --- HELPER METHODS --- //
  private async onAlarm() {
    if (this.hasAlarm) return;
    this.hasAlarm = true;

    // signal alarm
    await this.led.blink(Color.RED, Color.BLACK, 0.25);

    try {
      // read and verify pin
      const pin = await this.input.readLine(10);
      if (pin === '0000') {
        // TODO: pin
        this.hasAlarm = false;
        await this.led.blink(Color.GREEN, Color.BLACK, 1); // TODO: LED wrapper?
        return;
      }
    } finally {
      // power off
      this.gpio.write(this.powerPin, false);
    }
  }
}
