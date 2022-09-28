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
  rawTx: RawTxDto;
}

export interface CreateMasternodeDto {
  id: number;
  signedTx: string;
}
