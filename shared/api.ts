import axios, { AxiosRequestConfig, Method } from 'axios';
import jwtDecode from 'jwt-decode';
import Config from './config';
import { RawTxDto } from './dto/raw-tx.dto';
import { SignedTxDto } from './dto/signed-tx.dto';
import { Util } from './util';

export class Api {
  private readonly apiUrl;

  private accessToken?: string;
  private expires?: Date;

  constructor() {
    this.apiUrl = Config.api.url;
  }

  // --- Transaction --- //
  async getTransactions(ownerWallet: string): Promise<RawTxDto[]> {
    return this.callApi(`transaction/verified?ownerWallet=${ownerWallet}`);
  }

  async uploadSignedTransaction(dto: SignedTxDto): Promise<void> {
    return this.callApi(`transaction/${dto.id}/signed`, 'PUT', dto);
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

    return Util.retry(() => axios.request<T>(config).then((r) => r.data), tryCount, retryDelay);
  }

  private async getAccessToken(): Promise<string | undefined> {
    // renew
    if (this.accessToken == null || this.expires == null || this.expires <= new Date()) {
      const result = await axios.post<{ accessToken: string }>(`${this.apiUrl}/auth/sign-in`, {
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
