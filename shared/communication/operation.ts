import { Prevout } from '@defichain/jellyfish-transaction-builder';

export enum Operation {
  RECEIVE_WALLET_NAME = 'receive-wallet-name',
  SIGN_TX = 'sign-tx',
}

export interface SignedTxPayload {
  isError: boolean;
  signedTx: string;
}
