import { Api } from '../../../shared/api';
import { Node } from '../../../shared/node';
import { Logger } from '../../../shared/logger';
import { createMock } from '@golevelup/ts-jest';
import { WithdrawalHelper } from '../withdrawal-helper';
import { createDefaultLogger } from '../../../shared/__mocks__/locker.mock';
import { createCustomWithdrawal, createDefaultWithdrawal } from '../../../shared/dto/__mocks__/withdrawal.mock';
import { InWalletTransaction } from '@defichain/jellyfish-api-core/dist/category/wallet';
import Config from '../../../shared/config';

describe('WithdrawalHelper', () => {
  let service: WithdrawalHelper;

  let api: Api;
  let node: Node;
  let logger: Logger;

  function setupPayoutMocks() {
    jest.spyOn(node, 'sendUtxo').mockResolvedValue('tx id');
    jest.spyOn(node, 'waitForTx').mockResolvedValue({} as InWalletTransaction);
    jest.spyOn(api, 'setWithdrawalReady').mockResolvedValue();
  }

  beforeEach(() => {
    api = createMock<Api>();
    node = createMock<Node>();
    logger = createDefaultLogger();

    service = new WithdrawalHelper(api, node, logger);
  });

  it('should only return valid withdrawals', async () => {
    jest.spyOn(api, 'getPendingWithdrawals').mockResolvedValue([createDefaultWithdrawal()]);

    await expect(service.getValidWithdrawals()).resolves.toHaveLength(0);
  });

  it('should payout all withdrawals, if balance is enough', async () => {
    const balance = 50;
    const withdrawals = [createCustomWithdrawal({ id: 1, amount: 20 }), createCustomWithdrawal({ id: 2, amount: 10 })];

    setupPayoutMocks();

    await service.payoutWithdrawals(balance, withdrawals);

    expect(node.sendUtxo).toBeCalledWith({ [Config.payoutWalletAddress]: 30 });
    expect(api.setWithdrawalReady).toBeCalledTimes(withdrawals.length);
    expect(api.setWithdrawalReady).toBeCalledWith(2);
    expect(api.setWithdrawalReady).toBeCalledWith(1);
  });

  it('should payout all possible withdrawals, if balance is not enough', async () => {
    const balance = 50;
    const withdrawals = [
      createCustomWithdrawal({ id: 1, amount: 40 }),
      createCustomWithdrawal({ id: 2, amount: 20 }),
      createCustomWithdrawal({ id: 3, amount: 10 }),
    ];

    setupPayoutMocks();

    await service.payoutWithdrawals(balance, withdrawals);

    expect(node.sendUtxo).toBeCalledWith({ [Config.payoutWalletAddress]: 30 });
    expect(api.setWithdrawalReady).toBeCalledTimes(2);
    expect(api.setWithdrawalReady).toBeCalledWith(3);
    expect(api.setWithdrawalReady).toBeCalledWith(2);
  });
});
