import { MasternodeInfo, MasternodeState as MnState } from '@defichain/jellyfish-api-core/dist/category/masternode';
import { Masternode, MasternodeState } from '../../shared/dto/masternode';
import { Withdrawal } from '../../shared/dto/withdrawal';
import { Logger } from '../../shared/logger';
import { Util } from '../../shared/util';
import { Node } from '../../shared/node';
import { Api } from '../../shared/api';
import Config from '../../shared/config';

export class LiquidityHelper {
  constructor(private readonly api: Api, private readonly node: Node, private readonly logger: Logger) {}

  async checkLiquidity(balance: number, withdrawals: Withdrawal[], masternodes: Masternode[]): Promise<void> {
    const currentLiquidity = await this.getCurrentLiquidity(balance, withdrawals, masternodes);
    const excessiveLiquidity = currentLiquidity - Config.liquidity.max;
    const missingLiquidity = Config.liquidity.min - currentLiquidity;

    if (excessiveLiquidity > Config.masternode.collateral + Config.masternode.fee) {
      // create
      const count = Math.floor(excessiveLiquidity / (Config.masternode.collateral + Config.masternode.fee));
      await this.createMasternodes(count);
    } else if (missingLiquidity > 0) {
      // resign
      const count = Math.ceil(Math.abs(excessiveLiquidity) / Config.masternode.collateral);
      await this.resignMasternode(count, masternodes);
    }
  }

  private async getCurrentLiquidity(
    balance: number,
    withdrawals: Withdrawal[],
    masternodes: Masternode[],
  ): Promise<number> {
    const resigningMasternodes = masternodes.filter((mn) =>
      [MasternodeState.RESIGN_REQUESTED, MasternodeState.RESIGN_CONFIRMED, MasternodeState.RESIGNING].includes(
        mn.state,
      ),
    );

    const pendingResignAmount = resigningMasternodes.length * Config.masternode.collateral;
    const pendingWithdrawalAmount = Util.sumObj(withdrawals, 'amount');

    return balance + pendingResignAmount - pendingWithdrawalAmount;
  }

  // --- MASTERNODES ---- //
  private async createMasternodes(count: number): Promise<void> {
    let tx;
    for (let i = 0; i < count; i++) {
      tx = await this.node.sendUtxo({
        [Config.masternodeWalletAddress]: Config.masternode.collateral + Config.masternode.fee,
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

      const signature = await this.node.signMessage(
        Config.liquidityWalletAddress,
        Config.masternode.resignMessage(masternode.id, masternode.creationHash),
      );
      await this.api.requestMasternodeResign(masternode.id, signature);
    }
  }

  private async getMasternodeTms(
    masternodes: Masternode[],
  ): Promise<{ id: number; creationHash: string; tm: number }[]> {
    const runningMasternodes = masternodes.filter((mn) => mn.state === MasternodeState.CREATED);
    const masternodeInfos = await this.getMasternodeInfos(runningMasternodes);
    return masternodeInfos
      .filter((m) => m.info.state === MnState.ENABLED)
      .map((m) => ({ ...m, tm: Util.avg(m.info.targetMultipliers ?? []) }))
      .sort((a, b) => (a.tm > b.tm ? 1 : -1));
  }

  private async getMasternodeInfos(
    masternodes: Masternode[],
  ): Promise<{ id: number; creationHash: string; info: MasternodeInfo }[]> {
    const infos = [];
    for (const masternode of masternodes) {
      if (masternode.creationHash) {
        const info = await this.node.getMasternodeInfo(masternode.creationHash);
        infos.push({ id: masternode.id, creationHash: masternode.creationHash, info });
      }
    }

    return infos;
  }
}
