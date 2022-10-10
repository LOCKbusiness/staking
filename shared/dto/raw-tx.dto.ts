import { Prevout } from '@defichain/jellyfish-transaction-builder';

export interface RawTx {
  hex: string;
  prevouts: Prevout[];
  scriptHex: string;
}

export interface RawTxDto {
  id: string;
  rawTx: RawTx;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  issuerSignature: string;
  verifierSignature: string;
}
