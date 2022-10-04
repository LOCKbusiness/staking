import { Logger } from '../logger';

export function createDefaultLogger(): Logger {
  return new Logger('Unit Test');
}
