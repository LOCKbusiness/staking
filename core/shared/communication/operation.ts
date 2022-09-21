export enum Operation {
  CREATE_MASTERNODE = 'create-masternode',
  RESIGN_MASTERNODE = 'resign-masternode',
  REQUEST_API = 'request-api',
  TEST = 'test',
}

export type OperationPayload = CreateMasternodePayload | ResignMasternodePayload | RequestApiPayload | TestPayload;

export interface CreateMasternodePayload {}

export interface ResignMasternodePayload {}

export interface RequestApiPayload {
  url: string;
  body?: string;
}

export interface TestPayload {}
