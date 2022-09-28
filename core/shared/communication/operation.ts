import { Prevout } from '@defichain/jellyfish-transaction-builder';

export enum Operation {
  CREATE_MASTERNODE = 'create-masternode',
  RESIGN_MASTERNODE = 'resign-masternode',
  REQUEST_API = 'request-api',
  TEST = 'test',
  SIGN_TX = 'sign-tx',
}

export interface SignTxPayload {
  index: number;
  hex: string;
  prevouts: Prevout[];
  witness: any;
}

export interface RequestApiPayload {
  url: string;
  body?: string;
}

export interface TestPayload {
  txHex?: string;
}
