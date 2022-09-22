export enum Operation {
  CREATE_MASTERNODE = 'create-masternode',
  RESIGN_MASTERNODE = 'resign-masternode',
  REQUEST_API = 'request-api',
  TEST = 'test',
}

export interface RequestApiPayload {
  url: string;
  body?: string;
}

export interface TestPayload {
  txHex?: string;
}
