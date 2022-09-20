import { JsonRpcClient } from '@defichain/jellyfish-api-jsonrpc';
import { ApiClient } from '@defichain/jellyfish-api-core';
import { InWalletTransaction } from '@defichain/jellyfish-api-core/dist/category/wallet';
import { MasternodeInfo } from '@defichain/jellyfish-api-core/dist/category/masternode';
import { Util } from './util';
import Config from './config';

export class Node {
  private readonly client: ApiClient;

  private walletPassword?: string;

  constructor(port: number = 8555) {
    const passwordHash = Buffer.from(Config.node.auth).toString('base64');
    this.client = new JsonRpcClient(`http://127.0.0.1:${port}/`, {
      headers: { Authorization: 'Basic ' + passwordHash },
    });
  }

  async init(): Promise<void> {
    this.walletPassword = await Util.getCliInput('Wallet password:', true);

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
    const tx = await Util.poll(
      () => this.client.wallet.getTransaction(txId),
      (t) => (t?.confirmations ?? 0) > 0,
      5,
      timeout,
    );

    if (tx && tx.confirmations > 0) return tx;

    throw new Error(`Wait for TX ${txId} timed out`);
  }

  async getMasternodeInfo(id: string): Promise<MasternodeInfo> {
    return await this.client.masternode.getMasternode(id).then((r) => r[id]);
  }

  async signMessage(address: string, message: string): Promise<string> {
    return this.unlockWallet().then(() => this.client.call('signmessage', [address, message], 'number'));
  }

  // --- HELPER METHODS --- //
  private async unlockWallet(): Promise<void> {
    return this.client.call('walletpassphrase', [this.walletPassword, 60], 'number');
  }

  private roundAmount(amount: number): number {
    return Util.round(amount, 8);
  }
}
