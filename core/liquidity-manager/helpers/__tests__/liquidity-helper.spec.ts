import { Api } from '../../../shared/api';
import { Node } from '../../../shared/node';
import { Logger } from '../../../shared/logger';
import { LiquidityHelper } from '../liquidity-helper';
import { createMock } from '@golevelup/ts-jest';
import { Withdrawal } from '../../../shared/dto/withdrawal';
import { Masternode } from '../../../shared/dto/masternode';
import { InWalletTransaction } from '@defichain/jellyfish-api-core/dist/category/wallet';
import { createDefaultLogger } from '../../../shared/__mocks__/locker.mock';
import { createDefaultMasternode } from '../../../shared/dto/__mocks__/masternode.mock';
import { MasternodeInfo, MasternodeState } from '@defichain/jellyfish-api-core/dist/category/masternode';
import Config from '../../../shared/config';

describe('LiquidityHelper', () => {
  let service: LiquidityHelper;

  let api: Api;
  let node: Node;
  let logger: Logger;

  beforeEach(() => {
    api = createMock<Api>();
    node = createMock<Node>();
    logger = createDefaultLogger();

    service = new LiquidityHelper(api, node, logger);
  });

  it('should build a masternode, if balance is above max. liquidity', async () => {
    const balance = Config.liquidity.max + 30000;
    const withdrawals: Withdrawal[] = [];
    const masternodes: Masternode[] = [];

    jest.spyOn(node, 'sendUtxo').mockResolvedValue('tx id');
    jest.spyOn(node, 'waitForTx').mockResolvedValue({} as InWalletTransaction);

    await service.checkLiquidity(balance, withdrawals, masternodes);

    expect(node.sendUtxo).toBeCalledWith({ [Config.masternodeWalletAddress]: 20010 });
  });

  it('should resign a masternode, if balance is below min. liquidity', async () => {
    const balance = Config.liquidity.min - 5000;
    const withdrawals: Withdrawal[] = [];
    const masternodes: Masternode[] = [createDefaultMasternode()];

    jest.spyOn(node, 'getMasternodeInfo').mockResolvedValue({ state: MasternodeState.ENABLED } as MasternodeInfo);
    jest.spyOn(node, 'signMessage').mockResolvedValue('dummy-signature');

    await service.checkLiquidity(balance, withdrawals, masternodes);

    expect(api.requestMasternodeResign).toBeCalledWith(masternodes[0].id, 'dummy-signature');
  });
});
