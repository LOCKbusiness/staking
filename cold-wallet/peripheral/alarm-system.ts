import GPIO from 'rpi-gpio';
import { debounceTime, Subject } from 'rxjs';
import { UiState } from '../ui/ui-state.enum';
import { UserInterface } from '../ui/user-interface';
import Shell from 'shelljs';

export class AlarmSystem {
  private readonly gpio = GPIO.promise;

  private readonly alarmPin = 33; // TODO
  // private readonly powerPin = 0; // TODO

  private readonly $change = new Subject<boolean>();

  private hasAlarm = false;

  constructor(private readonly ui: UserInterface) {}

  async connect() {
    await this.gpio.setup(this.alarmPin, 'in', 'both');
    // await this.gpio.setup(this.powerPin, 'high');

    // add listener
    GPIO.on('change', (c, v) => c === this.alarmPin && this.$change.next(v));
    this.$change.pipe(debounceTime(10)).subscribe((v) => v && void this.onAlarm()); // TODO: adjust debounce time
  }

  async disconnect() {
    await this.gpio.destroy();
  }

  // --- HELPER METHODS --- //
  private async onAlarm() {
    if (this.hasAlarm) return;
    this.hasAlarm = true;

    // signal alarm
    await this.ui.set(UiState.ALARM);

    try {
      // read and verify pin
      const pin = await this.ui.readLine(10);
      if (pin === '0000') {
        // TODO: pin
        this.hasAlarm = false;
        await this.ui.set(UiState.RUNNING);
        return;
      }
    } finally {
      // power off
      // this.gpio.write(this.powerPin, false);
      Shell.exec('sudo shutdown -h now');
    }
  }
}
