export type LogPayload = object | string;

export class Logger {
  constructor(private readonly name: string) {}

  info(message: string, payload?: LogPayload): void {
    console.log(this.getMessage(message), payload ? payload : '');
  }

  warning(message: string, payload?: LogPayload): void {
    console.warn(this.getMessage(message), payload ? payload : '');
  }

  error(message: string, payload?: LogPayload): void {
    console.error(this.getMessage(message), payload ? payload : '');
  }

  private getMessage(message: string): string {
    return `${this.name} - ${new Date().toLocaleString()} - ${message}`;
  }
}
