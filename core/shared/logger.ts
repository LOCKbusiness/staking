export type LogPayload = object | string | unknown;

export enum LogLevel {
  DEBUG,
  INFO,
  WARNING,
  ERROR,
}

export class Logger {
  constructor(private readonly name: string, private readonly level = LogLevel.INFO) {}

  debug(message: string, payload?: LogPayload): void {
    if (this.level <= LogLevel.DEBUG) console.log(this.getMessage(message), payload ? payload : '');
  }

  info(message: string, payload?: LogPayload): void {
    if (this.level <= LogLevel.INFO) console.log(this.getMessage(message), payload ? payload : '');
  }

  warning(message: string, payload?: LogPayload): void {
    if (this.level <= LogLevel.WARNING) console.warn(this.getMessage(message), payload ? payload : '');
  }

  error(message: string, payload?: LogPayload): void {
    if (this.level <= LogLevel.ERROR) console.error(this.getMessage(message), payload ? payload : '');
  }

  private getMessage(message: string): string {
    return `${this.name} - ${new Date().toLocaleString()} - ${message}`;
  }
}
