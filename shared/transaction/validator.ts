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
    return Boolean(Config.signature.allowedMessages.find((regex) => message.match(regex)));
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
      this.voutHasWithAmount(tx.vout, new BigNumber(20000), ownerScript.stack) &&
      this.voutHasWithAmount(tx.vout, new BigNumber(10), createMasternodeOPCodes)
    );
  }

  private static resignMasternode(tx: CTransactionSegWit): boolean {
    return (
      tx.vout.length === 1 &&
      this.voutHasWithAmount(tx.vout, new BigNumber(0), [
        OP_CODES.OP_RETURN,
        OP_CODES.OP_DEFI_TX_RESIGN_MASTER_NODE(undefined as unknown as ResignMasternode),
      ])
    );
  }

  private static sendFromLiq(tx: CTransactionSegWit, script: Script): boolean {
    return (
      tx.vout.length === 2 &&
      !tx.vout[0].script.stack.map((code) => `${code.type}`).includes('OP_DEFI_TX') &&
      this.voutHas(tx.vout[1], script)
    );
  }

  private static sendToLiq(tx: CTransactionSegWit, script: Script): boolean {
    return tx.vout.length === 1 && this.voutHas(tx.vout[0], script);
  }

  private static voutContains(vout: Vout[], opCodes: OPCode[][]): boolean {
    return opCodes.every((opCodes) => vout.filter((v) => this.includesAll(v.script.stack, opCodes)));
  }

  private static voutHas(vout: Vout, script: Script): boolean {
    if (vout.script.stack.length !== script.stack.length) return false;
    return vout.script.stack.every(
      (code, index) => code.asBuffer().toString() === script.stack[index].asBuffer().toString(),
    );
  }

  private static voutHasWithAmount(vout: Vout[], value: BigNumber, opCodes: OPCode[]): boolean {
    return vout.filter((v) => v.value.isEqualTo(value) && this.includesAll(v.script.stack, opCodes)).length === 1;
  }

  private static includesAll(haystack: OPCode[], needles: OPCode[]): boolean {
    return needles.every((needle) => haystack.includes(needle));
  }
}
