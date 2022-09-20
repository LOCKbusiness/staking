import { MasternodeInfo, MasternodeState as MnState } from '@defichain/jellyfish-api-core/dist/category/masternode';
import { Masternode, MasternodeState } from '../../shared/dto/masternode';
import { Withdrawal } from '../../shared/dto/withdrawal';
import { Logger } from '../../shared/logger';
import { Util } from '../../shared/util';
import { Node } from '../../shared/node';
import { Api } from '../../shared/api';

export class LiquidityHelper {
  private readonly masternodeCollateral = 20000;
  private readonly masternodeFee = 10;

  private readonly minLiquidity = 50000; // TODO
  // TODO: max?

  constructor(private readonly api: Api, private readonly node: Node, private readonly logger: Logger) {}

  async checkLiquidity(balance: number, withdrawals: Withdrawal[], masternodes: Masternode[]): Promise<void> {
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
      this.logger.info(`Resigning masternode ${masternode.id}`);

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
}
