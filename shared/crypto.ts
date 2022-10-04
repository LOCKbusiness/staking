import { verify } from 'bitcoinjs-message';
import { Util } from './util';

export interface CheckSignature {
  message?: string;
  address?: string;
  signature?: string;
}

export class Crypto {
  static verifySignature(data: CheckSignature): boolean {
    if (!data.message || !data.address || !data.signature) return false;
    let isValid = false;
    try {
      isValid = this.verify(data.message, data.address, data.signature);
    } catch (e) {
      // ignore error
    }

    if (!isValid) {
      isValid = this.fallbackVerify(data.message, data.address, data.signature);
    }
    return isValid;
  }

  private static fallbackVerify(message: string, address: string, signature: string) {
    let isValid = false;
    const flags = [...Array(12).keys()].map((i) => i + 31);
    for (const flag of flags) {
      const flagByte = Buffer.alloc(1);
      flagByte.writeInt8(flag);
      let sigBuffer = Buffer.from(signature, 'base64').slice(1);
      sigBuffer = Buffer.concat([flagByte, sigBuffer]);
      const candidateSig = sigBuffer.toString('base64');
      try {
        isValid = this.verify(message, address, candidateSig);
        if (isValid) break;
      } catch (e) {
        // ignore error
      }
    }
    return isValid;
  }

  private static verify(message: string, address: string, signature: string): boolean {
    return verify(message, address, signature, Util.readNetwork().messagePrefix);
  }
}
