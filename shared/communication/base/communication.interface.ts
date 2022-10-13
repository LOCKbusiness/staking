import { Operation } from '../dto/operation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Subscriber = (payload: any) => Promise<any>;

export enum CommunicationType {
  SERIAL,
  TCP,
}

export interface ICommunication {
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  query<T, U>(operation: Operation, payload?: T): Promise<U>;
  on(operation: Operation, subscriber: Subscriber): void;
}
