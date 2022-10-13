import { Operation } from './operation';

export interface Message {
  id: string;
  operation: Operation;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
}
