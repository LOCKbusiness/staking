export enum MasternodeState {
  CREATED = 'Created',
  RESIGNING = 'Resigning',
  // TBD
}

export interface Masternode {
  id: number;
  state: MasternodeState;
  creationHash: string;
  // TBD
}
