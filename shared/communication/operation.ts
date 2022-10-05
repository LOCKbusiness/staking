import { Prevout } from '@defichain/jellyfish-transaction-builder';

export enum Operation {
  RECEIVE_WALLET_NAME = 'receive-wallet-name',
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scriptHex: any;
  apiSignature: string;
  masternodeSignature: string;
}
