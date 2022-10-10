import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'crypto';

const ALGORITHM = 'aes-256-ctr';
const ENCODING: BufferEncoding = 'base64';

export class Encryption {
  static encrypt(str: string, code: string): string {
    const data = Buffer.from(str);
    const iv = randomBytes(16);

    const cipher = createCipheriv(ALGORITHM, this.codeToKey(code), iv);
    return Buffer.concat([iv, cipher.update(data), cipher.final()]).toString(ENCODING);
  }

  static decrypt(str: string, code: string): string {
    const plain = Buffer.from(str, ENCODING);
    const data = plain.subarray(16);
    const iv = plain.subarray(0, 16);

    const decipher = createDecipheriv(ALGORITHM, this.codeToKey(code), iv);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString();
  }

  private static codeToKey(code: string): string {
    return createHash('sha256').update(code).digest('base64').substring(0, 32);
  }
}
