import { Prevout } from '@defichain/jellyfish-transaction-builder';

export enum Operation {
  REQUEST_API = 'request-api',
  SIGN_TX = 'sign-tx',
  PAYOUT_ALL = 'payout-all',
}

export interface SignedTxPayload {
  isError: boolean;
  signedTx: string;
}

export interface PayoutAllPayload {
  index: number;
}

export interface SignTxPayload {
  index: number;
  hex: string;
  prevouts: Prevout[];
  scriptHex: any;
}

export interface RequestApiPayload {
  url: string;
  body?: string;
}
