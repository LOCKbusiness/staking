import { OP_DEFI_TX, Script, Vout } from '@defichain/jellyfish-transaction';
import { fromScript } from '@defichain/jellyfish-address';
import { Util } from '../../shared/util';
import { TransactionType } from './enums';

export class PreFilter {
  static incomingTxTypes = [
    'OP_DEFI_TX_CREATE_MASTER_NODE',
    'OP_DEFI_TX_RESIGN_MASTER_NODE',
    'OP_DEFI_TX_VOTE',
    'OP_DEFI_TX_CREATE_VAULT',
    'OP_DEFI_TX_DEPOSIT_TO_VAULT',
    'OP_DEFI_TX_TAKE_LOAN',
    'OP_DEFI_TX_POOL_ADD_LIQUIDITY',
    'OP_DEFI_TX_PAYBACK_LOAN',
    'OP_DEFI_TX_WITHDRAW_FROM_VAULT',
    'OP_DEFI_TX_POOL_REMOVE_LIQUIDITY',
    'OP_DEFI_TX_COMPOSITE_SWAP',
    'OP_DEFI_TX_ANY_ACCOUNT_TO_ACCOUNT',
  ];
  static outgoingTxTypes = ['OP_DEFI_TX_ANY_ACCOUNT_TO_ACCOUNT'];

  static check(
    vouts: Vout[],
    listOfVaults: string[],
    listOfAddresses: string[],
    payload: { type: TransactionType },
  ): { isIncoming: boolean; isAllowed: boolean; defiTxType?: string } {
    if (vouts.length === 0) return { isIncoming: false, isAllowed: false };
    const expectedIsIncoming = this.getExpectedIsIncoming(payload.type);
    const [isIncoming, defiTxType] = this.isIncomingBasedOn(vouts, listOfVaults, listOfAddresses);
    return {
      isIncoming,
      isAllowed:
        (expectedIsIncoming !== undefined ? expectedIsIncoming === isIncoming : true) &&
        this.isOnCorrectList(defiTxType, isIncoming ? this.incomingTxTypes : this.outgoingTxTypes),
      defiTxType,
    };
  }

  private static isOnCorrectList(defiTxType: string | undefined, txTypes: string[]): boolean {
    if (!defiTxType) return true;
    return txTypes.includes(defiTxType);
  }

  private static isIncomingBasedOn(
    vouts: Vout[],
    listOfVaults: string[],
    listOfAddresses: string[],
  ): [boolean, string | undefined] {
    const defiTxType = this.retrieveTxType(vouts[0]);
    return [this.isBeneficiaryInternal(vouts, listOfVaults, listOfAddresses, defiTxType), defiTxType];
  }

  private static retrieveTxType(vout: Vout): string | undefined {
    const opDefiTx = vout.script.stack.find((opCode) => (opCode as OP_DEFI_TX)?.type === 'OP_DEFI_TX');
    if (!opDefiTx) return undefined;
    if ('tx' in opDefiTx) {
      return (opDefiTx as OP_DEFI_TX).tx.name;
    }
    return undefined;
  }

  private static isBeneficiaryInternal(
    vouts: Vout[],
    listOfVaults: string[],
    listOfAddresses: string[],
    defiTxType?: string,
  ): boolean {
    switch (defiTxType) {
      case 'OP_DEFI_TX_CREATE_MASTER_NODE': {
        const ownerScript = vouts[1].script;
        return listOfAddresses.includes(this.parseAddressFromScript(ownerScript));
      }
      case 'OP_DEFI_TX_CREATE_VAULT': {
        const vaultOwnerScript = (vouts[0].script.stack[1] as OP_DEFI_TX).tx.data.ownerAddress;
        const changeScript = vouts[1].script;
        return (
          listOfAddresses.includes(this.parseAddressFromScript(vaultOwnerScript)) &&
          listOfAddresses.includes(this.parseAddressFromScript(changeScript))
        );
      }
      case 'OP_DEFI_TX_PAYBACK_LOAN':
      case 'OP_DEFI_TX_DEPOSIT_TO_VAULT': {
        const vaultId = (vouts[0].script.stack[1] as OP_DEFI_TX).tx.data.vaultId;
        const changeScript = vouts[1].script;
        return listOfVaults.includes(vaultId) && listOfAddresses.includes(this.parseAddressFromScript(changeScript));
      }
      case 'OP_DEFI_TX_WITHDRAW_FROM_VAULT':
      case 'OP_DEFI_TX_TAKE_LOAN': {
        const defiTxData = (vouts[0].script.stack[1] as OP_DEFI_TX).tx.data;
        const changeScript = vouts[1].script;
        return (
          listOfVaults.includes(defiTxData.vaultId) &&
          listOfAddresses.includes(this.parseAddressFromScript(defiTxData.to)) &&
          listOfAddresses.includes(this.parseAddressFromScript(changeScript))
        );
      }
      case 'OP_DEFI_TX_POOL_ADD_LIQUIDITY': {
        const ownerScript = (vouts[0].script.stack[1] as OP_DEFI_TX).tx.data.shareAddress;
        const changeScript = vouts[1].script;
        return (
          listOfAddresses.includes(this.parseAddressFromScript(ownerScript)) &&
          listOfAddresses.includes(this.parseAddressFromScript(changeScript))
        );
      }
      case 'OP_DEFI_TX_POOL_REMOVE_LIQUIDITY': {
        const ownerScript = (vouts[0].script.stack[1] as OP_DEFI_TX).tx.data.script;
        const changeScript = vouts[1].script;
        return (
          listOfAddresses.includes(this.parseAddressFromScript(ownerScript)) &&
          listOfAddresses.includes(this.parseAddressFromScript(changeScript))
        );
      }
      case 'OP_DEFI_TX_COMPOSITE_SWAP': {
        const toScript = (vouts[0].script.stack[1] as OP_DEFI_TX).tx.data.poolSwap.toScript;
        const changeScript = vouts[1].script;
        return (
          listOfAddresses.includes(this.parseAddressFromScript(toScript)) &&
          listOfAddresses.includes(this.parseAddressFromScript(changeScript))
        );
      }
      case 'OP_DEFI_TX_ANY_ACCOUNT_TO_ACCOUNT': {
        const toScript = (vouts[0].script.stack[1] as OP_DEFI_TX).tx.data.to[0].script;
        const changeScript = vouts.length === 2 ? vouts[1].script : undefined;
        return (
          listOfAddresses.includes(this.parseAddressFromScript(toScript)) &&
          (changeScript ? listOfAddresses.includes(this.parseAddressFromScript(changeScript)) : true)
        );
      }
      case 'OP_DEFI_TX_RESIGN_MASTER_NODE':
      case 'OP_DEFI_TX_VOTE':
        return true;
      case undefined:
        // check UTXO based
        return vouts.every((v) => {
          const address = this.parseAddressFromScript(v.script);
          return listOfAddresses.includes(address);
        });
      default:
        return false;
    }
  }

  private static parseAddressFromScript(script: Script): string {
    const network = Util.readNetwork();
    const decodedAddress = fromScript(script, network.name);
    if (!decodedAddress?.address) throw new Error('Could not parse address of script');
    return decodedAddress.address;
  }

  private static getExpectedIsIncoming(type: TransactionType): boolean | undefined {
    switch (type) {
      case TransactionType.CREATE_MASTERNODE:
      case TransactionType.RESIGN_MASTERNODE:
      case TransactionType.VOTE_MASTERNODE:
      case TransactionType.UTXO_MERGE:
      case TransactionType.UTXO_SPLIT:
      case TransactionType.SEND_TO_LIQ:
      case TransactionType.CREATE_VAULT:
      case TransactionType.DEPOSIT_TO_VAULT:
      case TransactionType.WITHDRAW_FROM_VAULT:
      case TransactionType.TAKE_LOAN:
      case TransactionType.PAYBACK_LOAN:
      case TransactionType.POOL_ADD_LIQUIDITY:
      case TransactionType.POOL_REMOVE_LIQUIDITY:
      case TransactionType.COMPOSITE_SWAP:
        return true;
      case TransactionType.WITHDRAWAL:
        return false;
      case TransactionType.SEND_FROM_LIQ:
      case TransactionType.ACCOUNT_TO_ACCOUNT:
        return undefined;
    }
  }
}
