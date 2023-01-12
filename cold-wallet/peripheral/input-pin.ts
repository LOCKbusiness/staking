import GPIO from 'rpi-gpio';
import { debounceTime as debounce, Observable, Subject } from 'rxjs';

type Edge = 'none' | 'rising' | 'falling' | 'both';

export class InputPin {
  private readonly gpio = GPIO.promise;

  private readonly $change = new Subject<boolean>();

  constructor(private readonly channel: number, private readonly edge: Edge, private readonly debounceTime: number) {}

  async setup(): Promise<boolean> {
    GPIO.on('change', (c, v) => c === this.channel && this.$change.next(v));

    return await this.gpio.setup(this.channel, 'in', this.edge);
  }

  readonly onChange: Observable<boolean> = this.$change.pipe(debounce(this.debounceTime));

  async read(): Promise<boolean> {
    return await this.gpio.read(this.channel);
  }
}
