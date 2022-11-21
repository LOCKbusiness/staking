import axios, { AxiosRequestConfig, Method } from 'axios';
import jwtDecode from 'jwt-decode';
import Config from '../../shared/config';
import { CfpDto } from '../../shared/dto/cfp.dto';
import { RawTxDto } from '../../shared/dto/raw-tx.dto';
import { SignedTxDto } from '../../shared/dto/signed-tx.dto';
import { Util } from '../../shared/util';

export interface ApiAuthenticationInfo {
  address: string;
  signature: string;
}

interface ApiSignMessage {
  message: string;
}

export class Api {
  private readonly apiUrl;

  private authenticationInfo?: ApiAuthenticationInfo;
  private accessToken?: string;
  private expires?: Date;

  constructor() {
    this.apiUrl = Config.api.url;
  }

  setAuthentication(info: ApiAuthenticationInfo) {
    this.authenticationInfo = info;
  }

  // --- Transaction --- //
  async getTransactions(ownerWallet: string): Promise<RawTxDto[]> {
    return this.callApi(`transaction/verified?ownerWallet=${ownerWallet}`);
  }

  async uploadSignedTransaction(dto: SignedTxDto): Promise<void> {
    return this.callApi(`transaction/${dto.id}/signed`, 'PUT', dto);
  }

  // --- CFP VOTING --- //
  async getCfpVotingMessages(): Promise<CfpDto[]> {
    return this.callApi(`voting/sign-messages`);
  }

  // --- SIGN MESSAGE --- //
  async getSignMessage(address: string): Promise<string> {
    return this.callApi<ApiSignMessage>(`auth/sign-message?address=${address}`).then((info) => info.message);
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
      headers: {
        Authorization: 'Bearer ' + (await this.getAccessToken()),
        'Device-Id': Config.deviceId,
      },
    };

    return Util.retry(() => axios.request<T>(config).then((r) => r.data), tryCount, retryDelay);
  }

  private async getAccessToken(): Promise<string | undefined> {
    if (!this.authenticationInfo) return undefined;
    // renew
    if (this.accessToken == null || this.expires == null || this.expires <= new Date()) {
      const result = await axios.post<{ accessToken: string }>(`${this.apiUrl}/auth/sign-in`, this.authenticationInfo);
      this.accessToken = result.data.accessToken;

      const jwt: { exp: number } = jwtDecode(this.accessToken);
      this.expires = new Date(jwt.exp * 1000);
      this.expires.setMinutes(this.expires.getMinutes() - 10);
    }

    return this.accessToken;
  }
}
