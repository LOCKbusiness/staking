import { RawTxDto } from './raw-tx';

export enum MasternodeState {
  IDLE = 'Idle',
  CREATED = 'Created',
  CREATING = 'Creating',
  RESIGN_REQUESTED = 'ResignRequested',
  RESIGN_CONFIRMED = 'ResignConfirmed',
  RESIGNING = 'Resigning',
  RESIGNED = 'Resigned',
}

export interface RawTxCreateMasternodeDto {
  id: number;
  accountIndex: number;
  owner: string;
  operator: string;
  rawTx: RawTxDto;
}

export interface RawTxResignMasternodeDto {
  id: number;
  accountIndex: number;
  operator: string;
  rawTx: RawTxDto;
}

export interface SignedMasternodeTxDto {
  id: number;
  signedTx: string;
}
