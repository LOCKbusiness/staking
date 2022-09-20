import axios, { AxiosRequestConfig, Method } from 'axios';
import jwtDecode from 'jwt-decode';
import { Util } from './util';

export class Api {
  private readonly apiUrl;

  private accessToken?: string;
  private expires?: Date;

  constructor() {
    this.apiUrl = process.env.API_URL;
  }

  // --- HELPER METHODS --- //
  private async callApi<T>(url: string, method: Method = 'GET', data?: any, tryCount = 1, retryDelay = 1): Promise<T> {
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
        address: process.env.API_ADDRESS,
        signature: process.env.API_SIGNATURE,
      });
      this.accessToken = result.data.accessToken;

      const jwt: { exp: number } = jwtDecode(this.accessToken);
      this.expires = new Date(jwt.exp * 1000);
      this.expires.setMinutes(this.expires.getMinutes() - 10);
    }

    return this.accessToken;
  }
}
