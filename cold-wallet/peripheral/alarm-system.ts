import GPIO from 'rpi-gpio';
import { UiState } from '../ui/ui-state.enum';
import { UserInterface } from '../ui/user-interface';
import Shell from 'shelljs';
import Config from '../../shared/config';
import { InputPin } from './input-pin';

export class AlarmSystem {
  private readonly gpio = GPIO.promise;

  private readonly openPin = new InputPin(33, 'both', 500);
  private readonly motionPin = new InputPin(7, 'both', 500);

  private hasAlarm = false;
  private isOpen?: boolean = undefined;

  constructor(private readonly ui: UserInterface) {}

  async connect() {
    await this.openPin.setup();
    await this.motionPin.setup();

    this.isOpen = !(await this.openPin.read());

    // add listeners
    this.openPin.onChange.subscribe((v) => this.onOpen(!v));
    this.motionPin.onChange.subscribe((v) => this.onMotion(v));
  }

  async disconnect() {
    await this.gpio.destroy();
  }

  // --- HELPER METHODS --- //
  private onOpen(isOpen: boolean) {
    this.isOpen = isOpen;
    if (isOpen) void this.onAlarm();
  }

  private onMotion(hasMotion: boolean) {
    if (hasMotion && !this.isOpen) void this.onAlarm();
  }

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
      await this.ui.showSuccess();
      await this.ui.set(UiState.RUNNING);
      return;
    } catch {
      // power off
      await this.ui.set(UiState.ERROR);
      Shell.exec('sudo shutdown -h now');
    }
  }
}
