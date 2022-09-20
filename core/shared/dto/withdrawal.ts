export enum WithdrawalState {
  // TBD
}

export interface Withdrawal {
  id: number;
  state: WithdrawalState;
  address: string;
  amount: number;
  signature: string;
}
