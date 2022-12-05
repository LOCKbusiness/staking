import { KeyInput } from '../peripheral/key-input';
import { Color, Led } from '../peripheral/led';
import { UiState } from './ui-state.enum';

export class UserInterface {
  private readonly led: Led;
  private readonly input: KeyInput;

  constructor() {
    this.led = new Led();
    this.input = new KeyInput(this.led);
  }

  async connect() {
    await this.led.connect();
    await this.input.connect();
  }

  // --- INPUT --- //
  async readLine(timeout?: number): Promise<string> {
    return await this.input.readLine(timeout);
  }

  // --- OUTPUT --- //
  async set(state: UiState) {
    switch (state) {
      case UiState.WAITING:
        await this.led.blink(Color.BLUE);
        break;

      case UiState.LOADING:
        await this.led.blink(Color.YELLOW);
        break;

      case UiState.RUNNING:
        await this.led.blink(Color.GREEN, Color.BLACK, 1);
        break;

      case UiState.ALARM:
        await this.led.blink(Color.RED, Color.BLACK, 0.25);
        break;

      case UiState.ERROR:
        await this.led.set(Color.RED);
        break;
    }
  }
}
