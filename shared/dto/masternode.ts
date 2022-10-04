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

export interface Masternode {
  id: number;
  operator: string;
  owner: string;
  ownerWallet: string;
  accountIndex: number;
  state: MasternodeState;
}

export interface RawTxMasternodeDto {
  id: number;
  accountIndex: number;
  owner: string;
  operator: string;
  rawTx: RawTxDto;
  apiSignature: string;
}

export interface SignedMasternodeTxDto {
  id: number;
  signedTx: string;
}
