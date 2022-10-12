export enum Operation {
  RECEIVE_WALLET_NAME = 'receive-wallet-name',
  RECEIVE_ADDRESS = 'receive-address',
  SIGN_TX = 'sign-tx',
  SIGN_MESSAGE = 'sign-message',
}

export interface SignedTxPayload {
  isError: boolean;
  signedTx: string;
}
