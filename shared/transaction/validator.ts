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
import Config from '../config';

export class Validator {
  static isMessageAllowed(message: string): boolean {
    return (
      message.toLowerCase().match(Config.signature.allowedMessages.regex) != null ||
      message.startsWith(Config.signature.allowedMessages.startsWith)
    );
  }

  static isAllowed(tx: CTransactionSegWit, script: Script, liqScript: Script): boolean {
    return (
      Validator.createMasternode(tx, script) ||
      Validator.resignMasternode(tx) ||
      Validator.sendFromLiq(tx, liqScript) ||
      Validator.sendToLiq(tx, liqScript)
    );
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

  private static sendFromLiq(tx: CTransactionSegWit, script: Script): boolean {
    return tx.vout.length === 2 && this.voutContains(tx.vout, [[OP_CODES.OP_RETURN], script.stack]);
  }

  private static sendToLiq(tx: CTransactionSegWit, script: Script): boolean {
    return tx.vout.length === 1 && this.voutContains(tx.vout, [script.stack]);
  }

  private static voutContains(vout: Vout[], opCodes: OPCode[][]): boolean {
    return opCodes.every((opCodes) => vout.filter((v) => this.includesAll(v.script.stack, opCodes)));
  }

  private static voutHas(vout: Vout[], value: BigNumber, opCodes: OPCode[]): boolean {
    return vout.filter((v) => v.value.isEqualTo(value) && this.includesAll(v.script.stack, opCodes)).length === 1;
  }

  private static includesAll(haystack: OPCode[], needles: OPCode[]): boolean {
    return needles.every((needle) => haystack.includes(needle));
  }
}
