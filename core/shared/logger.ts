export class Logger {
  constructor(private readonly name: string) {}

  info(message: string, obj?: any): void {
    console.log(this.getMessage(message), obj ? obj : '');
  }

  warning(message: string, obj?: any): void {
    console.warn(this.getMessage(message), obj ? obj : '');
  }

  error(message: string, obj?: any): void {
    console.error(this.getMessage(message), obj ? obj : '');
  }

  private getMessage(message: string): string {
    return `${this.name} - ${new Date()} - ${message}`;
  }
}
