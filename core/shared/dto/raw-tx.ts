import { Prevout } from '@defichain/jellyfish-transaction-builder';

export interface RawTxDto {
  hex: string;
  scriptHex: string;
  prevouts: Prevout[];
}
