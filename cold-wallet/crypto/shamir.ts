import { split, join } from 'shamir';
import { randomBytes } from 'crypto';

const SECRET_ENCODING: BufferEncoding = 'utf-8';
const SHARE_ENCODING: BufferEncoding = 'base64';

export class Shamir {
  static split(secret: string, shareCount: number, thresholdCount: number): string[] {
    const secretBytes = this.stringToBytes(secret, SECRET_ENCODING);
    const shares = split(randomBytes, shareCount, thresholdCount, secretBytes);

    // add the index to share
    return Object.entries(shares).map(([key, share]) => key + this.bytesToString(share, SHARE_ENCODING));
  }

  static join(shares: string[]): string {
    // get the index from share
    const sharesObject = shares.reduce(
      (prev, curr) => ({ ...prev, [curr.slice(0, 1)]: this.stringToBytes(curr.slice(1), SHARE_ENCODING) }),
      {},
    );
    const recovered = join(sharesObject);

    return this.bytesToString(recovered, SECRET_ENCODING);
  }

  // --- HELPER METHODS --- //
  private static stringToBytes(str: string, encoding: BufferEncoding): Buffer {
    return Buffer.from(str, encoding);
  }

  private static bytesToString(bytes: Uint8Array, encoding: BufferEncoding): string {
    return Buffer.from(bytes).toString(encoding);
  }
}
