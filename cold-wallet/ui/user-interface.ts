import { Util } from '../../shared/util';
import { KeyInput } from '../peripheral/key-input';
import { Color, Led } from '../peripheral/led';
import { UiState } from './ui-state.enum';

export class UserInterface {
  private readonly led: Led;
  private readonly input: KeyInput;

  private state?: UiState;

  constructor() {
    this.led = new Led();
    this.input = new KeyInput(this.led);
  }

  async connect() {
    await this.led.connect();
    await this.input.connect();
    await this.setIdle();
  }

  // --- INPUT --- //
  async readLine(timeout?: number): Promise<string> {
    return await this.input.readLine(timeout);
  }

  // --- OUTPUT --- //
  async showActivity() {
    await this.led.flash(Color.GREEN);
  }

  async showSuccess() {
    for (let i = 0; i < 3; i++) {
      await this.showActivity();
      await Util.sleep(0.2);
    }
  }

  async set(state: UiState) {
    this.state = state;

    switch (state) {
      case UiState.WAITING:
        await this.led.blink(Color.BLUE);
        break;

      case UiState.LOADING:
        await this.led.set(Color.YELLOW);
        break;

      case UiState.ALARM:
        await this.led.blink(Color.RED, Color.BLACK, 0.25);
        break;

      case UiState.WARNING:
        await this.led.blink(Color.RED, Color.BLACK, 1);
        break;

      case UiState.ERROR:
        await this.led.set(Color.RED);
        break;
    }
  }

  async reset(state: UiState) {
    if (this.state === state) await this.setIdle();
  }

  private async setIdle() {
    this.state = undefined;
    await this.led.set(Color.BLACK);
  }
}
