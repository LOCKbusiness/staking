import { exit } from 'process';
import { config } from 'dotenv';
import { Api } from '../shared/api';
import { Node } from '../shared/node';
import { Logger } from '../shared/logger';
import { Util } from '../shared/util';
import { LiquidityHelper } from './helpers/liquidity-helper';
import { WithdrawalHelper } from './helpers/withdrawal-helper';

class App {
  private readonly api: Api;
  private readonly node: Node;
  private readonly logger: Logger;

  private readonly liquidity: LiquidityHelper;
  private readonly withdrawal: WithdrawalHelper;

  constructor() {
    config();

    this.api = new Api();
    this.node = new Node();
    this.logger = new Logger('Liquidity Manager');

    this.liquidity = new LiquidityHelper(this.api, this.node, this.logger);
    this.withdrawal = new WithdrawalHelper(this.api, this.node, this.logger);
  }

  async run(): Promise<void> {
    await this.node.init();

    for (;;) {
      try {
        const balance = await this.node.getBalance();
        const withdrawals = await this.withdrawal.getValidWithdrawals();
        const masternodes = await this.api.getMasternodes();

        // check liquidity
        // TODO: debounce?
        await this.liquidity.checkLiquidity(balance, withdrawals, masternodes);

        // payout
        await this.withdrawal.payoutWithdrawals(balance, withdrawals);
      } catch (e) {
        this.logger.error(`Exception: ${e}`);
      }

      await Util.sleep(300);
    }
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
