import { split, join } from 'shamir';
import { randomBytes } from 'crypto';

const SECRET_ENCODING: BufferEncoding = 'utf-8';
const SHARE_ENCODING: BufferEncoding = 'base64';

export class Shamir {
  static split(secret: string, shares: number, threshold: number): string[] {
    const secretBytes = this.stringToBytes(secret, SECRET_ENCODING);
    const parts = split(randomBytes, shares, threshold, secretBytes);

    // add the index to share
    return Object.entries(parts).map(([key, part]) => key + this.bytesToString(part, SHARE_ENCODING));
  }

  static join(parts: string[]): string {
    // get the index from share
    const partsObject = parts.reduce(
      (prev, curr) => ({ ...prev, [curr.slice(0, 1)]: this.stringToBytes(curr.slice(1), SHARE_ENCODING) }),
      {},
    );
    const recovered = join(partsObject);

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
