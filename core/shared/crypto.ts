import { verify } from 'bitcoinjs-message';
import { Util } from './util';

export class Crypto {
  static verifySignature(message: string, address: string, signature: string): boolean {
    let isValid = false;
    try {
      isValid = this.verify(message, address, signature);
    } catch (e) {
      // ignore error
    }

    if (!isValid) {
      isValid = this.fallbackVerify(message, address, signature);
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
