import { Prevout } from '@defichain/jellyfish-transaction-builder';

export enum Operation {
  SIGN_TX = 'sign-tx',
}

export interface SignedTxPayload {
  isError: boolean;
  signedTx: string;
}

export interface SignTxPayload {
  index: number;
  hex: string;
  prevouts: Prevout[];
  scriptHex: any;
  apiSignature: string;
  masternodeSignature: string;
}
