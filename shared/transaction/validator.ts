import {
  CTransactionSegWit,
  Vout,
  OPCode,
  Script,
  OP_CODES,
  OP_DEFI_TX,
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
      this.voutAmountAndOpCodesAreEqual(tx.vout[0], new BigNumber(10), createMasternodeOPCodes) &&
      this.voutAmountAndScriptAreEqual(tx.vout[1], new BigNumber(20000), ownerScript)
    );
  }

  private static resignMasternode(tx: CTransactionSegWit): boolean {
    return (
      tx.vout.length === 1 &&
      this.voutAmountAndOpCodesAreEqual(tx.vout[0], new BigNumber(0), [
        OP_CODES.OP_RETURN,
        OP_CODES.OP_DEFI_TX_RESIGN_MASTER_NODE(undefined as unknown as ResignMasternode),
      ])
    );
  }

  private static sendFromLiq(tx: CTransactionSegWit, script: Script): boolean {
    return (
      tx.vout.length === 2 &&
      !tx.vout[0].script.stack.map((code) => `${code.type}`).includes('OP_DEFI_TX') &&
      this.voutScriptIsEqual(tx.vout[1], script)
    );
  }

  private static sendToLiq(tx: CTransactionSegWit, script: Script): boolean {
    return tx.vout.length === 1 && this.voutScriptIsEqual(tx.vout[0], script);
  }

  private static voutScriptIsEqual(vout: Vout, script: Script): boolean {
    if (vout.script.stack.length !== script.stack.length) return false;
    return vout.script.stack.every(
      (code, index) => code.asBuffer().toString() === script.stack[index].asBuffer().toString(),
    );
  }

  private static voutAmountAndScriptAreEqual(vout: Vout, value: BigNumber, script: Script): boolean {
    return vout.value.isEqualTo(value) && this.voutScriptIsEqual(vout, script);
  }

  private static voutAmountAndOpCodesAreEqual(vout: Vout, value: BigNumber, opCodes: OPCode[]): boolean {
    return vout.value.isEqualTo(value) && this.opCodesAreEqual(vout.script.stack, opCodes);
  }

  private static opCodesAreEqual(a: OPCode[], b: OPCode[]): boolean {
    if (a.length !== b.length) return false;
    const checks = a.map((code, index) =>
      code.type === 'OP_DEFI_TX'
        ? this.opDefiTxAreEqual(code as OP_DEFI_TX, b[index] as OP_DEFI_TX)
        : code.type === b[index].type,
    );
    return !checks.includes(false);
  }

  private static opDefiTxAreEqual(a: OP_DEFI_TX, b: OP_DEFI_TX): boolean {
    if ('tx' in a && 'tx' in b) return a.tx.name === b.tx.name;
    return false;
  }
}
