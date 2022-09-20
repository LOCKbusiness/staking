export enum WithdrawalState {
  PENDING = 'Pending',
  // TBD
}

export interface Withdrawal {
  id: number;
  state: WithdrawalState;
  address: string;
  amount: number;
  signature: string;
}