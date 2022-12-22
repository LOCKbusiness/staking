export enum Operation {
  PING = 'ping',
  RECEIVE_WALLET_NAME = 'receive-wallet-name',
  RECEIVE_ADDRESS = 'receive-address',
  SIGN_TX = 'sign-tx',
  SIGN_MESSAGE = 'sign-message',
}

export interface SignedTxPayload {
  isError: boolean;
  signedTx: string;
}

export interface SignMessagePayload {
  message: string;
  accountIndex: number;
}

export interface SignedMessagePayload {
  isError: boolean;
  signedMessage: string;
}
