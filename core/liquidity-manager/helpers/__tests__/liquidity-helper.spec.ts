import { Api } from '../../../shared/api';
import { Node } from '../../../shared/node';
import { Logger } from '../../../shared/logger';
import { LiquidityHelper } from '../liquidity-helper';
import { createMock } from '@golevelup/ts-jest';
import { Withdrawal } from '../../../shared/dto/withdrawal';
import { Masternode, MasternodeState } from '../../../shared/dto/masternode';
import { InWalletTransaction } from '@defichain/jellyfish-api-core/dist/category/wallet';
import { createDefaultLogger } from '../../../shared/__mocks__/logger.mock';
import { createCustomMasternode, createDefaultMasternode } from '../../../shared/dto/__mocks__/masternode.mock';
import { MasternodeInfo, MasternodeState as MnState } from '@defichain/jellyfish-api-core/dist/category/masternode';
import Config from '../../../shared/config';
import { createCustomWithdrawal } from '../../../shared/dto/__mocks__/withdrawal.mock';

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

  it('should build a masternode, if balance is above max', async () => {
    const balance = Config.liquidity.max + 30000;
    const withdrawals: Withdrawal[] = [];
    const masternodes: Masternode[] = [];

    jest.spyOn(node, 'sendUtxo').mockResolvedValue('tx id');
    jest.spyOn(node, 'waitForTx').mockResolvedValue({} as InWalletTransaction);

    await service.checkLiquidity(balance, withdrawals, masternodes);

    expect(node.sendUtxo).toBeCalledWith({ [Config.masternodeWalletAddress]: 20010 });
    expect(api.requestMasternodeResign).toBeCalledTimes(0);
  });

  it('should resign a masternode, if balance is below min', async () => {
    const balance = Config.liquidity.min - 5000;
    const withdrawals: Withdrawal[] = [];
    const masternodes: Masternode[] = [createDefaultMasternode()];

    jest.spyOn(node, 'getMasternodeInfo').mockResolvedValue({ state: MnState.ENABLED } as MasternodeInfo);
    jest.spyOn(node, 'signMessage').mockResolvedValue('dummy-signature');

    await service.checkLiquidity(balance, withdrawals, masternodes);

    expect(node.sendUtxo).toBeCalledTimes(0);
    expect(api.requestMasternodeResign).toBeCalledWith(masternodes[0].id, 'dummy-signature');
  });

  it('should not change masternode count, if balance is below min but already resigning', async () => {
    const balance = Config.liquidity.min - 5000;
    const withdrawals: Withdrawal[] = [];
    const masternodes: Masternode[] = [createCustomMasternode({ state: MasternodeState.RESIGNING })];

    await service.checkLiquidity(balance, withdrawals, masternodes);

    expect(node.sendUtxo).toBeCalledTimes(0);
    expect(api.requestMasternodeResign).toBeCalledTimes(0);
  });

  it('should resign a masternode, if balance is above min but open withdrawals', async () => {
    const balance = Config.liquidity.min - 5000;
    const withdrawals: Withdrawal[] = [createCustomWithdrawal({ amount: 10000 })];
    const masternodes: Masternode[] = [createDefaultMasternode()];

    jest.spyOn(node, 'getMasternodeInfo').mockResolvedValue({ state: MnState.ENABLED } as MasternodeInfo);
    jest.spyOn(node, 'signMessage').mockResolvedValue('dummy-signature');

    await service.checkLiquidity(balance, withdrawals, masternodes);

    expect(node.sendUtxo).toBeCalledTimes(0);
    expect(api.requestMasternodeResign).toBeCalledWith(masternodes[0].id, 'dummy-signature');
  });
});
