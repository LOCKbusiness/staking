import { Network } from '@defichain/jellyfish-network';
import { verify } from 'bitcoinjs-message';

export interface CheckSignature {
  message?: string;
  address?: string;
  signature?: string;
  network?: Network;
}

export class Verify {
  static signature(check: CheckSignature): boolean {
    if (!check.message || !check.address || !check.signature || !check.network) return false;
    return verify(check.message, check.address, check.signature, check.network.messagePrefix);
  }
}
