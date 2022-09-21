import axios, { AxiosRequestConfig, Method } from 'axios';
import jwtDecode from 'jwt-decode';
import Config from './config';
import { Masternode } from './dto/masternode';
import { Withdrawal } from './dto/withdrawal';
import { Util } from './util';

export class Api {
  private readonly apiUrl;

  private accessToken?: string;
  private expires?: Date;

  constructor() {
    this.apiUrl = Config.api.url;
  }

  // --- MASTERNODES --- //
  async getMasternodes(): Promise<Masternode[]> {
    return await this.callApi('masternode');
  }

  async createMasternode(
    id: number,
    date: Date,
    hash: string,
    owner: string,
    ownerWallet: string,
    timeLock: number,
  ): Promise<void> {
    return await this.callApi(`masternode/${id}/create`, 'PUT', { date, hash, owner, ownerWallet, timeLock });
  }

  async requestMasternodeResign(id: number, signature: string): Promise<void> {
    return await this.callApi(`masternode/${id}/requestResign`, 'PUT', { signature });
  }

  async resigningMasternode(id: number, date: Date, hash: string): Promise<void> {
    return await this.callApi(`masternode/${id}/resign`, 'PUT', { date, hash });
  }

  async resignedMasternode(id: number): Promise<void> {
    return await this.callApi(`masternode/${id}/resigned`, 'PUT');
  }

  // --- WITHDRAWALS --- //
  async getPendingWithdrawals(): Promise<Withdrawal[]> {
    return await this.callApi('staking/withdrawals/pending');
  }

  async setWithdrawalReady(id: number): Promise<void> {
    return await this.callApi(`staking/withdrawal/${id}/ready`, 'POST', undefined, 3);
  }

  // --- HELPER METHODS --- //
  private async callApi<T>(
    url: string,
    method: Method = 'GET',
    data?: object,
    tryCount = 1,
    retryDelay = 300,
  ): Promise<T> {
    const config: AxiosRequestConfig = {
      url: `${this.apiUrl}/${url}`,
      method,
      data,
      headers: { Authorization: 'Bearer ' + (await this.getAccessToken()) },
    };

    return await Util.retry(() => axios.request<T>(config).then((r) => r.data), tryCount, retryDelay);
  }

  private async getAccessToken(): Promise<string | undefined> {
    // renew
    if (this.accessToken == null || this.expires == null || this.expires <= new Date()) {
      const result = await axios.post<{ accessToken: string }>(`${this.apiUrl}/auth/signIn`, {
        address: Config.api.address,
        signature: Config.api.signature,
      });
      this.accessToken = result.data.accessToken;

      const jwt: { exp: number } = jwtDecode(this.accessToken);
      this.expires = new Date(jwt.exp * 1000);
      this.expires.setMinutes(this.expires.getMinutes() - 10);
    }

    return this.accessToken;
  }
}
