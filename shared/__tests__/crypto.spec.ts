import { Crypto } from '../crypto';

const address = '78j7v645N5AnTUxSWZahZc7BSeZ7LFADEH';
const message = 'test-sign-message';
const signature = 'IMGGSePk3Dd9BTk0NiT/UlB8NW8g2NhAdz1CQ3zYb/n7WT05ALh0/6Y3nVY/BUd8FIxFrkDos2At8owR5W0Znuk=';

describe('Crypto', () => {
  it('should verify a valid signed message', () => {
    expect(Crypto.verifySignature({ address, message, signature })).toBeTruthy();
  });

  it('should not verify another address', () => {
    expect(Crypto.verifySignature({ address: '78j7v645N5AnTUxSWZahZc7BSeZ7LFADEE', message, signature })).toBeFalsy();
  });

  it('should not verify an invalid message', () => {
    expect(Crypto.verifySignature({ address, message: 'something-else', signature })).toBeFalsy();
  });

  it('should not verify an invalid signature', () => {
    expect(Crypto.verifySignature({ address, message, signature: 'IMGGSePk3Dd9BTk0NiT/UlB8NW8g2Nh' })).toBeFalsy();
  });
});
