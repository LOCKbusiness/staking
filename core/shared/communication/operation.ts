export enum Operation {
  CREATE_MASTERNODE = 'create-masternode',
  RESIGN_MASTERNODE = 'resign-masternode',
  TEST = 'test',
}

export type OperationPayload = CreateMasternodePayload | ResignMasternodePayload | TestPayload;

export interface CreateMasternodePayload {}

export interface ResignMasternodePayload {}

export interface TestPayload {}
