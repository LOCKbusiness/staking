import { SignTxPayload, TxType } from '../../shared/communication/operation';
import {
  CTransactionSegWit,
  Vout,
  OPCode,
  Script,
  OP_CODES,
  CreateMasternode,
  ResignMasternode,
} from '@defichain/jellyfish-transaction';
import { BigNumber } from '@defichain/jellyfish-api-core';

export class Validator {
  static isAllowed(tx: CTransactionSegWit, data: SignTxPayload, ownerScript: Script): boolean {
    switch (data.type) {
      case TxType.CREATE_MASTERNODE:
        return Validator.createMasternode(tx, ownerScript);
      case TxType.RESIGN_MASTERNODE:
        return Validator.resignMasternode(tx);
      default:
        return false;
    }
  }

  private static createMasternode(tx: CTransactionSegWit, ownerScript: Script): boolean {
    const createMasternodeOPCodes = [
      OP_CODES.OP_RETURN,
      OP_CODES.OP_DEFI_TX_CREATE_MASTER_NODE(undefined as unknown as CreateMasternode),
    ];

    return (
      tx.vout.length === 2 &&
      this.voutHas(tx.vout, new BigNumber(20000), ownerScript.stack) &&
      this.voutHas(tx.vout, new BigNumber(10), createMasternodeOPCodes)
    );
  }

  private static resignMasternode(tx: CTransactionSegWit): boolean {
    return (
      tx.vout.length === 1 &&
      this.voutHas(tx.vout, new BigNumber(0), [
        OP_CODES.OP_RETURN,
        OP_CODES.OP_DEFI_TX_RESIGN_MASTER_NODE(undefined as unknown as ResignMasternode),
      ])
    );
  }

  private static voutHas(vout: Vout[], value: BigNumber, opCodes: OPCode[]): boolean {
    return vout.filter((v) => v.value.isEqualTo(value) && this.includesAll(v.script.stack, opCodes)).length === 1;
  }

  private static includesAll(haystack: OPCode[], needles: OPCode[]): boolean {
    return needles.filter((needle) => haystack.includes(needle)).length === 1;
  }
}
