import GPIO from 'rpi-gpio';
import { debounceTime, Subject } from 'rxjs';
import { UiState } from '../ui/ui-state.enum';
import { UserInterface } from '../ui/user-interface';
import Shell from 'shelljs';
import Config from '../../shared/config';

export class AlarmSystem {
  private readonly gpio = GPIO.promise;
  private readonly alarmPin = 33;

  private readonly $change = new Subject<boolean>();

  private hasAlarm = false;

  constructor(private readonly ui: UserInterface) {}

  async connect() {
    await this.gpio.setup(this.alarmPin, 'in', 'both');

    // add listener
    GPIO.on('change', (c, v) => c === this.alarmPin && this.$change.next(v));
    this.$change.pipe(debounceTime(500)).subscribe((v) => !v && void this.onAlarm());
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
      const pin = await this.ui.readLine(15);
      if (pin !== Config.unlockPin) throw new Error('Wrong pin');

      this.hasAlarm = false;
      await this.ui.set(UiState.RUNNING);
      return;
    } catch {
      // power off
      await this.ui.set(UiState.ERROR);
      Shell.exec('sudo shutdown -h now');
    }
  }
}
