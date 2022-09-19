import { JsonRpcClient } from '@defichain/jellyfish-api-jsonrpc';
import { ApiClient } from '@defichain/jellyfish-api-core';
import { InWalletTransaction } from '@defichain/jellyfish-api-core/dist/category/wallet';
import { getCliInput, poll, round } from './util';

export class Node {
  private readonly client: ApiClient;

  private walletPassword?: string;

  constructor(port: number = 8555) {
    const passwordHash = Buffer.from(process.env.NODE_RPC_AUTH ?? '').toString('base64');
    this.client = new JsonRpcClient(`http://127.0.0.1:${port}/`, {
      headers: { Authorization: 'Basic ' + passwordHash },
    });
  }

  async init(): Promise<void> {
    this.walletPassword = await getCliInput('Wallet password:', true);

    // verify password
    await this.unlockWallet();
    console.log('OK');
  }

  async getBalance(): Promise<number> {
    return this.client.wallet.getBalance().then((b) => b.toNumber());
  }

  async sendUtxo(amounts: Record<string, number>, subtractFeeFrom?: string[]): Promise<string> {
    for (const address in amounts) {
      amounts[address] = this.roundAmount(amounts[address]);
    }
    return this.unlockWallet().then(() => this.client.wallet.sendMany(amounts, subtractFeeFrom));
  }

  async waitForTx(txId: string, timeout = 1200): Promise<InWalletTransaction> {
    const tx = await poll(
      () => this.client.wallet.getTransaction(txId),
      (t) => (t?.confirmations ?? 0) > 0,
      5,
      timeout,
    );

    if (tx && tx.confirmations > 0) return tx;

    throw new Error(`Wait for TX ${txId} timed out`);
  }

  // --- HELPER METHODS --- //
  private async unlockWallet(): Promise<void> {
    return this.client.call('walletpassphrase', [this.walletPassword, 60], 'number');
  }

  private roundAmount(amount: number): number {
    return round(amount, 8);
  }
}
