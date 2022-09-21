// import { BaseSerialCommunication } from '../shared/communication/base-serial-communication';
import { BaseSocketCommunication } from '../shared/communication/base-socket-communication';
import fetch from 'cross-fetch';
import { Message } from '../shared/communication/message';
import { Operation, RequestApiPayload } from '../shared/communication/operation';
import { Method, ResponseAsString } from '@defichain/whale-api-client';

// export class ColdWalletCommunication extends BaseSerialCommunication {
//   getPath(): string {
//     return '/dev/cu.usbserial-01434108';
//   }
// }

export class ColdWalletCommunication extends BaseSocketCommunication {
  connectToPort(): number {
    return 9000;
  }

  async receivedMessage(message: Message): Promise<Message> {
    switch (message.operation) {
      case Operation.REQUEST_API:
        const payload = message.payload as RequestApiPayload;
        const response = await _fetch('GET', payload.url, payload.body);
        return { ...message, payload: response };
      default:
        return Promise.reject();
    }
  }
}

async function _fetch(method: Method, url: string, body?: string): Promise<ResponseAsString> {
  const response = await fetch(url, {
    method: method,
    headers: method !== 'GET' ? { 'Content-Type': 'application/json' } : {},
    body: body,
    cache: 'no-cache',
  });

  return {
    status: response.status,
    body: await response.text(),
  };
}
