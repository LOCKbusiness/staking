export enum MasternodeState {
  IDLE = 'Idle',
  CREATED = 'Created',
  RESIGN_REQUESTED = 'ResignRequested',
  RESIGN_CONFIRMED = 'ResignConfirmed',
  RESIGNING = 'Resigning',
  RESIGNED = 'Resigned',
}

export interface Masternode {
  id: number;
  state: MasternodeState;
  operator: string;

  owner?: string;
  creationHash?: string;
}
