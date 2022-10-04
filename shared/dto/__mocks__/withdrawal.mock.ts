import { Withdrawal, WithdrawalState } from "../withdrawal";

const defaultWithdrawal: Partial<Withdrawal> = {
  id: 1,
  state: WithdrawalState.PENDING,
  address: 'address',
  amount: 10,
  signature: 'signature',
};

export function createDefaultWithdrawal(): Withdrawal {
  return createCustomWithdrawal({});
}

export function createCustomWithdrawal(customValues: Partial<Withdrawal>): Withdrawal {
  return { ...defaultWithdrawal, ...customValues } as Withdrawal;
}
