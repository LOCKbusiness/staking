import { Withdrawal } from '../../shared/dto/withdrawal';
import { Crypto } from '../../shared/crypto';
import { Api } from '../../shared/api';
import { Node } from '../../shared/node';
import { Logger } from '../../shared/logger';
import Config from '../../shared/config';

export class WithdrawalHelper {
  constructor(private readonly api: Api, private readonly node: Node, private readonly logger: Logger) {}

  async getValidWithdrawals(): Promise<Withdrawal[]> {
    const withdrawals = await this.api.getPendingWithdrawals();
    return withdrawals.filter(this.isWithdrawalValid);
  }

  private isWithdrawalValid(withdrawal: Withdrawal): boolean {
    // TODO: verify with blockchain balance?
    return Crypto.verifySignature(withdrawal.address + withdrawal.amount, withdrawal.address, withdrawal.signature);
  }

  async payoutWithdrawals(balance: number, withdrawals: Withdrawal[]): Promise<void> {
    const sortedWithdrawals = withdrawals.sort((a, b) => a.amount - b.amount);

    // determine possible withdrawals
    let withdrawalSum = 0;
    const possibleWithdrawals: Withdrawal[] = [];
    for (const withdrawal of sortedWithdrawals) {
      if (withdrawalSum + withdrawal.amount > balance - 1) break;

      withdrawalSum += withdrawal.amount;
      possibleWithdrawals.push(withdrawal);
    }

    if (withdrawalSum > 0) {
      const tx = await this.node.sendUtxo({ [Config.payoutWalletAddress]: withdrawalSum });
      this.logger.info(
        `Sending withdrawals ${possibleWithdrawals
          .map((w) => w.id)
          .join(', ')} (total ${withdrawalSum} DFI) to payout wallet: ${tx}`,
      );

      await this.node.waitForTx(tx).catch((e) => this.logger.error(`Wait for payout TX failed: ${e}`));

      // TODO: implement some error handling in case of API update failure?
      for (const withdrawal of possibleWithdrawals) {
        await this.api.setWithdrawalReady(withdrawal.id);
      }
    }
  }
}
