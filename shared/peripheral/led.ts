import GPIO from 'rpi-gpio';

export enum Color {
  RED = 'red',
  GREEN = 'green',
  BLUE = 'blue',
  YELLOW = 'yellow',
  CYAN = 'cyan',
  MAGENTA = 'magenta',
  WHITE = 'white',
  BLACK = 'black',
}

export class Led {
  private readonly gpio = GPIO.promise;

  private readonly pins = [1, 2, 3]; // RGB // TODO
  private readonly colors: { [color in Color]: boolean[] } = {
    [Color.RED]: [true, false, false],
    [Color.GREEN]: [false, true, false],
    [Color.BLUE]: [false, false, true],
    [Color.YELLOW]: [true, true, false],
    [Color.CYAN]: [false, true, true],
    [Color.MAGENTA]: [true, false, true],
    [Color.WHITE]: [true, true, true],
    [Color.BLACK]: [false, false, false],
  };

  private currentColor = Color.BLACK;
  private blinker?: NodeJS.Timer;

  async connect() {
    // setup all pins as outputs
    for (const pin of this.pins) {
      await this.gpio.setup(pin, 'low');
    }
  }

  async disconnect() {
    await this.gpio.destroy();
  }

  async set(color: Color): Promise<void> {
    if (this.blinker) clearInterval(this.blinker);

    await this.setColor(color);
  }

  async flash(color: Color, timeout = 0.1): Promise<void> {
    const previousColor = this.currentColor;

    await this.setColor(color);
    setTimeout(async () => await this.setColor(previousColor), timeout * 1000);
  }

  async blink(color: Color, interval = 0.5): Promise<void> {
    const previousColor = this.currentColor;

    this.blinker = setInterval(async () => {
      await this.setColor(this.currentColor === previousColor ? color : previousColor);
    }, interval);
  }

  // --- HELPER METHODS --- //
  private async setColor(color: Color): Promise<void> {
    const config = this.colors[color];
    for (let i = 0; i < this.pins.length; i++) {
      await this.gpio.write(this.pins[i], config[i]);
    }

    this.currentColor = color;
  }
}
