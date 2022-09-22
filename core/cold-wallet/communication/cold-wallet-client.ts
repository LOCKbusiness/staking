import {
  ApiPagedResponse,
  Method,
  ResponseAsString,
  WhaleApiClient,
  WhaleApiResponse,
} from '@defichain/whale-api-client';
import { Logger } from '../../shared/logger';

const staticPathsToResponse: { [path: string]: string } = {
  'fee/estimate': '{"data":0.00005}',
};
const forwardPaths = ['transactions/unspent'];

export class ColdWalletClient extends WhaleApiClient {
  private readonly logger = new Logger('Cold Wallet Client');

  private forwardRequest?: (url: string, body?: string) => Promise<ResponseAsString>;

  setForwardRequest(func: (url: string, body?: string) => Promise<ResponseAsString>) {
    this.forwardRequest = func;
  }

  paginate<T>(response: ApiPagedResponse<T>): Promise<ApiPagedResponse<T>> {
    this.logger.debug('paginate');
    return super.paginate(response);
  }

  async requestData<T>(method: Method, path: string, object?: any): Promise<T> {
    if (method !== 'GET') {
      this.logger.warning('attempt a POST', path);
      return Promise.reject();
    }
    this.logger.debug('requestData\n', { method, path, object });
    const response = await super.requestData(method, path, object);
    this.logger.debug('requestData\n', response);
    return response as T;
  }

  async requestList<T>(
    method: Method,
    path: string,
    size: number,
    next?: string | undefined,
  ): Promise<ApiPagedResponse<T>> {
    if (method !== 'GET') {
      this.logger.warning('attempt a POST', path);
      return Promise.reject();
    }
    this.logger.debug('requestList\n', { method, path, size, next });
    const response = await super.requestList(method, path, size, next);
    this.logger.debug('requestList\n', response);
    return response as ApiPagedResponse<T>;
  }

  async requestAsApiResponse<T>(method: Method, path: string, object?: any): Promise<WhaleApiResponse<T>> {
    this.logger.debug('requestAsApiResponse\n', { method, path, object });
    const response = await super.requestAsApiResponse(method, path, object);
    this.logger.debug('requestAsApiResponse\n', response);
    return response as WhaleApiResponse<T>;
  }

  async requestAsString(method: Method, path: string, body?: string | undefined): Promise<ResponseAsString> {
    this.logger.debug('requestAsString\n', { method, path, body });
    // set response to default reject
    let response;
    const cleanedPath = this.cleanQueryParams(path);
    if (this.isStatic(cleanedPath)) {
      this.logger.info('resolve static', cleanedPath);
      response = new Promise((resolve) => {
        resolve({ status: 200, body: staticPathsToResponse[cleanedPath] });
      });
    }
    if (this.shouldForward(cleanedPath)) {
      this.logger.info('forward', cleanedPath);
      const url = this.buildUrl(path);
      response = await this.forwardRequest?.(url, body);
    }
    this.logger.debug('requestAsString\n', response);
    return response as ResponseAsString;
  }

  private isStatic(path: string): boolean {
    return (
      Object.keys(staticPathsToResponse).filter((p) => {
        return path.endsWith(p);
      }).length > 0
    );
  }

  private shouldForward(path: string): boolean {
    return (
      forwardPaths.filter((p) => {
        return path.endsWith(p);
      }).length > 0
    );
  }

  private cleanQueryParams(path: string): string {
    return path.split('?')[0];
  }

  private buildUrl(path: string): string {
    const { url: urlString, version, network, timeout } = this.options;
    return `${urlString as string}/${version as string}/${network as string}/${path}`;
  }
}
