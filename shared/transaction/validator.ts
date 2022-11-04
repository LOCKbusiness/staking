import {
  CTransactionSegWit,
  Vout,
  OPCode,
  Script,
  OP_CODES,
  OP_DEFI_TX,
  CreateMasternode,
  ResignMasternode,
  AnyAccountToAccount,
  CreateVault,
  DepositToVault,
  WithdrawFromVault,
  TakeLoan,
  PaybackLoan,
  PoolAddLiquidity,
  PoolRemoveLiquidity,
  CompositeSwap,
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
      Validator.sendFromLiq(tx, liqScript) || // & withdrawals
      Validator.sendToLiq(tx, liqScript) || // & merge utxos
      Validator.split(tx, liqScript) ||
      Validator.sendAccountToAccount(tx) ||
      Validator.createVault(tx, script) ||
      Validator.depositToVault(tx, script) ||
      Validator.withdrawFromVault(tx, script) ||
      Validator.takeLoan(tx, script) ||
      Validator.paybackLoan(tx, script) ||
      Validator.addPoolLiquidity(tx, script) ||
      Validator.removePoolLiquidity(tx, script) ||
      Validator.compositeSwap(tx, script)
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

  private static split(tx: CTransactionSegWit, script: Script): boolean {
    return tx.vout.every((v) => this.voutScriptIsEqual(v, script));
  }

  private static sendAccountToAccount(tx: CTransactionSegWit): boolean {
    return (
      tx.vout.length === 2 &&
      this.voutAmountAndOpCodesAreEqual(tx.vout[0], new BigNumber(0), [
        OP_CODES.OP_RETURN,
        OP_CODES.OP_DEFI_TX_ANY_ACCOUNT_TO_ACCOUNT(undefined as unknown as AnyAccountToAccount),
      ])
    );
  }

  private static createVault(tx: CTransactionSegWit, script: Script): boolean {
    return Validator.defiTx(
      tx,
      script,
      OP_CODES.OP_DEFI_TX_CREATE_VAULT(undefined as unknown as CreateVault),
      Config.defichain.vaultFee,
    );
  }

  private static depositToVault(tx: CTransactionSegWit, script: Script): boolean {
    return Validator.defiTx(tx, script, OP_CODES.OP_DEFI_TX_DEPOSIT_TO_VAULT(undefined as unknown as DepositToVault));
  }

  private static withdrawFromVault(tx: CTransactionSegWit, script: Script): boolean {
    return Validator.defiTx(
      tx,
      script,
      OP_CODES.OP_DEFI_TX_WITHDRAW_FROM_VAULT(undefined as unknown as WithdrawFromVault),
    );
  }

  private static takeLoan(tx: CTransactionSegWit, script: Script): boolean {
    return Validator.defiTx(tx, script, OP_CODES.OP_DEFI_TX_TAKE_LOAN(undefined as unknown as TakeLoan));
  }

  private static paybackLoan(tx: CTransactionSegWit, script: Script): boolean {
    return Validator.defiTx(tx, script, OP_CODES.OP_DEFI_TX_PAYBACK_LOAN(undefined as unknown as PaybackLoan));
  }

  private static addPoolLiquidity(tx: CTransactionSegWit, script: Script): boolean {
    return Validator.defiTx(
      tx,
      script,
      OP_CODES.OP_DEFI_TX_POOL_ADD_LIQUIDITY(undefined as unknown as PoolAddLiquidity),
    );
  }

  private static removePoolLiquidity(tx: CTransactionSegWit, script: Script): boolean {
    return Validator.defiTx(
      tx,
      script,
      OP_CODES.OP_DEFI_TX_POOL_REMOVE_LIQUIDITY(undefined as unknown as PoolRemoveLiquidity),
    );
  }

  private static compositeSwap(tx: CTransactionSegWit, script: Script): boolean {
    return Validator.defiTx(tx, script, OP_CODES.OP_DEFI_TX_COMPOSITE_SWAP(undefined as unknown as CompositeSwap));
  }

  private static defiTx(tx: CTransactionSegWit, script: Script, defiTx: OP_DEFI_TX, amount = 0): boolean {
    return (
      tx.vout.length === 2 &&
      this.voutAmountAndOpCodesAreEqual(tx.vout[0], new BigNumber(amount), [OP_CODES.OP_RETURN, defiTx]) &&
      this.voutScriptIsEqual(tx.vout[1], script)
    );
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
