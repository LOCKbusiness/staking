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

export enum TxType {
  CREATE_MASTERNODE,
  RESIGN_MASTERNODE,
  PAYBACK_COLLATERAL,
}

export interface SignTxPayload {
  index: number;
  type: TxType;
  hex: string;
  prevouts: Prevout[];
  scriptHex: any;
  apiSignature: string;
  masternodeSignature: string;
}

export interface RequestApiPayload {
  url: string;
  body?: string;
}
