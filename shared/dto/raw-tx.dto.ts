import { Prevout } from '@defichain/jellyfish-transaction-builder';

export interface RawTx {
  hex: string;
  scriptHex: string;
  prevouts: Prevout[];
}

export interface RawTxDto {
  id: string;
  rawTx: RawTx;
  accountIndex: number;
  apiSignature: string;
  masternodeSignature: string;
}
