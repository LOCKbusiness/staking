import { exit } from 'process';
import { config } from 'dotenv';
import { Api } from '../shared/api';
import { Node } from '../shared/node';
import { Withdrawal } from '../shared/dto/withdrawal';
import { Crypto } from '../shared/crypto';
import { Masternode, MasternodeState } from '../shared/dto/masternode';
import { Logger } from '../shared/logger';
import { MasternodeInfo, MasternodeState as MnState } from '@defichain/jellyfish-api-core/dist/category/masternode';
import { Util } from '../shared/util';

class App {
  private readonly masternodeCollateral = 20000;
  private readonly masternodeFee = 10;

  private readonly minLiquidity = 50000; // TODO
  // TODO: max?

  private readonly api: Api;
  private readonly node: Node;
  private readonly logger: Logger;

  constructor() {
    config();

    this.api = new Api();
    this.node = new Node();
    this.logger = new Logger('Liquidity Manager');
  }

  async run(): Promise<void> {
    await this.node.init();

    while (true) {
      try {
        const balance = await this.node.getBalance();
        const withdrawals = await this.getValidWithdrawals();
        const masternodes = await this.api.getMasternodes();

        // check liquidity
        // TODO: debounce?
        await this.checkLiquidity(balance, withdrawals, masternodes);

        // payout
        await this.payoutWithdrawals(balance, withdrawals);
      } catch (e) {
        this.logger.error(`Exception: ${e}`);
      }

      await Util.sleep(60);
    }
  }

  // --- LIQUIDITY --- //
  private async getCurrentLiquidity(
    balance: number,
    withdrawals: Withdrawal[],
    masternodes: Masternode[],
  ): Promise<number> {
    const resigningMasternodes = masternodes.filter((mn) =>
      [MasternodeState.RESIGNING /* TODO: add other enum values */].includes(mn.state),
    );

    const pendingResignAmount = resigningMasternodes.length * this.masternodeCollateral;
    const pendingWithdrawalAmount = Util.sumObj(withdrawals, 'amount');

    return balance + pendingResignAmount - pendingWithdrawalAmount;
  }

  private async checkLiquidity(balance: number, withdrawals: Withdrawal[], masternodes: Masternode[]): Promise<void> {
    const currentLiquidity = await this.getCurrentLiquidity(balance, withdrawals, masternodes);
    const excessiveLiquidity = currentLiquidity - this.minLiquidity;
    if (excessiveLiquidity > this.masternodeCollateral + this.masternodeFee) {
      // create
      const count = Math.floor(excessiveLiquidity / (this.masternodeCollateral + this.masternodeFee));
      await this.createMasternodes(count);
    } else if (excessiveLiquidity < 0) {
      // resign
      const count = Math.ceil(Math.abs(excessiveLiquidity) / this.masternodeCollateral);
      await this.resignMasternode(count, masternodes);
    }
  }

  // --- MASTERNODES ---- //
  private async createMasternodes(count: number): Promise<void> {
    let tx;
    for (let i = 0; i < count; i++) {
      tx = await this.node.sendUtxo({
        [process.env.MASTERNODE_WALLET_ADDRESS as string]: this.masternodeCollateral + this.masternodeFee,
      });
      this.logger.info(`Sending collateral to masternode wallet: ${tx}`);
    }

    if (tx) await this.node.waitForTx(tx).catch((e) => this.logger.error(`Wait for creation TX failed: ${e}`));
  }

  private async resignMasternode(count: number, masternodes: Masternode[]): Promise<void> {
    // sort masternodes by target multiplier
    const masternodeTms = await this.getMasternodeTms(masternodes);

    for (const masternode of masternodeTms.slice(0, count)) {
      this.logger.info(`Resigning master node ${masternode.id}`);

      // TODO: create resign signature
      await this.api.requestMasternodeResign(masternode.id, 'TODO');
    }
  }

  private async getMasternodeTms(masternodes: Masternode[]): Promise<(Masternode & { tm: number })[]> {
    const runningMasternodes = masternodes.filter((mn) => mn.state === MasternodeState.CREATED);
    const masternodeInfos = await this.getMasternodeInfos(runningMasternodes);
    return masternodeInfos
      .filter((m) => m.info.state === MnState.ENABLED)
      .map((m) => ({ ...m, tm: Util.avg(m.info.targetMultipliers ?? []) }))
      .sort((a, b) => (a.tm > b.tm ? 1 : -1));
  }

  private async getMasternodeInfos(masternodes: Masternode[]): Promise<(Masternode & { info: MasternodeInfo })[]> {
    const infos = [];
    for (const masternode of masternodes) {
      if (masternode.creationHash) {
        const info = await this.node.getMasternodeInfo(masternode.creationHash);
        infos.push({ ...masternode, info });
      }
    }

    return infos;
  }

  // --- WITHDRAWALS --- //
  private async getValidWithdrawals(): Promise<Withdrawal[]> {
    const withdrawals = await this.api.getPendingWithdrawals();
    return withdrawals.filter(this.isWithdrawalValid);
  }

  private isWithdrawalValid(withdrawal: Withdrawal): boolean {
    // TODO: verify with blockchain balance?
    return Crypto.verifySignature(withdrawal.address + withdrawal.amount, withdrawal.address, withdrawal.signature);
  }

  private async payoutWithdrawals(balance: number, withdrawals: Withdrawal[]): Promise<void> {
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
      const tx = await this.node.sendUtxo({ [process.env.PAYOUT_WALLET_ADDRESS as string]: withdrawalSum });
      this.logger.info(
        `Sending withdrawals ${possibleWithdrawals.join(', ')} (total ${withdrawalSum} DFI) to payout wallet: ${tx}`,
      );

      await this.node.waitForTx(tx).catch((e) => this.logger.error(`Wait for payout TX failed: ${e}`));

      // TODO: implement some error handling in case of API update failure?
      for (const withdrawal of possibleWithdrawals) {
        await this.api.setWithdrawalReady(withdrawal.id);
      }
    }
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
