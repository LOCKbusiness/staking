import GPIO from 'rpi-gpio';
import { UiState } from '../ui/ui-state.enum';
import { UserInterface } from '../ui/user-interface';
import Shell from 'shelljs';
import Config from '../../shared/config';
import { InputPin } from './input-pin';
import { Util } from '../../shared/util';

export class AlarmSystem {
  private readonly gpio = GPIO.promise;

  private readonly closePin = new InputPin(33, 'both', 100);
  private readonly motionPin = new InputPin(35, 'both', 1);

  private hasAlarm = false;
  private closedOn?: Date = undefined;

  constructor(private readonly ui: UserInterface) {}

  async connect() {
    await this.closePin.setup();
    await this.motionPin.setup();

    await this.closePin.read().then((c) => this.setCloseDate(c));

    // add listeners
    this.closePin.onChange.subscribe((v) => this.onClose(v));
    this.motionPin.onChange.subscribe((v) => this.onMotion(v));
  }

  async disconnect() {
    await this.gpio.destroy();
  }

  // --- HELPER METHODS --- //
  private setCloseDate(isClosed: boolean) {
    this.closedOn = isClosed ? this.closedOn ?? new Date() : undefined;
  }

  private onClose(isClosed: boolean) {
    if (!isClosed) this.onAlarm();

    this.setCloseDate(isClosed);
  }

  private onMotion(hasMotion: boolean) {
    if (hasMotion) this.onAlarm();
  }

  private onAlarm() {
    if (!this.closedOn || this.closedOn > Util.secondsBefore(10)) return;

    void this.signalAlarm();
  }

  private async signalAlarm() {
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
      await this.ui.reset(UiState.ALARM);
      return;
    } catch {
      // power off
      await this.ui.set(UiState.ERROR);
      Shell.exec('sudo shutdown -h now');
    }
  }
}
