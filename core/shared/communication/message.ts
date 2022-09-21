import { Operation } from './operation';

export interface Message {
  id: string;
  operation: Operation;
  payload: any;
}
