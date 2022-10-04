import { exit } from 'process';
import {
  Operation,
  RequestApiPayload,
  SignedTxPayload,
  SignTxPayload,
  TxType,
} from '../shared/communication/operation';
import { Logger } from '../shared/logger';
import { Util } from '../shared/util';
import { ColdWalletCommunication } from './cold-wallet-communication';
import fetch from 'cross-fetch';
import { Method, ResponseAsString } from '@defichain/whale-api-client';
import Config from '../shared/config';
import { Api } from '../shared/api';
import { SignedMasternodeTxDto, RawTxMasternodeDto, MasternodeState, Masternode } from '../shared/dto/masternode';

class App {
  private readonly communication: ColdWalletCommunication;
  private readonly logger: Logger;
  private readonly api: Api;

  constructor() {
    this.communication = new ColdWalletCommunication();
    this.logger = new Logger('Masternode Manager');
    this.api = new Api();
  }

  async run(): Promise<void> {
    await this.communication.connect();

    this.communication.on(Operation.REQUEST_API, (data: RequestApiPayload) => _fetch('GET', data.url, data.body));

    for (;;) {
      try {
        // fetch info from API
        const masternodes = await this.api.getMasternodes();

        // check if something needs to be done by this wallet
        const numberOfCreating = masternodes.filter(
          (m) => m.state === MasternodeState.CREATING && m.ownerWallet === Config.wallet.name,
        ).length;
        const numberOfResignConfirmed = masternodes.filter(
          (m) => m.state === MasternodeState.RESIGN_CONFIRMED && m.ownerWallet === Config.wallet.name,
        ).length;
        const resigningMasternodes = masternodes.filter(
          (m) => m.state === MasternodeState.RESIGNING && m.ownerWallet === Config.wallet.name,
        );

        // executing based on received information
        if (numberOfCreating > 0) {
          await this.handleCreateMasternodes();
        }
        if (numberOfResignConfirmed > 0) {
          await this.handleResignMasternodes();
        }
        if (resigningMasternodes.length > 0) {
          await this.handleResigning(resigningMasternodes);
        }
      } catch (e) {
        this.logger.error(`Exception: ${e}`);
      } finally {
        await Util.sleep(5);
      }
    }
  }

  async handleCreateMasternodes(): Promise<void> {
    this.logger.info('handle create masternodes');
    const rawTxCreateMasternodes = await this.api.getMasternodesCreating(Config.wallet.name);
    // parse and create operations
    if (rawTxCreateMasternodes.length > 0) {
      const signedMasternodeTxs = await this.signMasternodes(rawTxCreateMasternodes, TxType.CREATE_MASTERNODE);
      for (const signedMasternodeTx of signedMasternodeTxs) {
        this.logger.info('create masternode', signedMasternodeTx.id);
        try {
          await this.api.createMasternode(signedMasternodeTx);
        } catch (e) {
          this.logger.error('Sending create masternode ERROR:', e);
        }
      }
    }
  }

  async handleResignMasternodes(): Promise<void> {
    this.logger.info('handle resign masternodes');
    const rawTxResignMasternodes = await this.api.getMasternodesResigning(Config.wallet.name);

    if (rawTxResignMasternodes.length > 0) {
      const signedMasternodeTxs = await this.signMasternodes(rawTxResignMasternodes, TxType.RESIGN_MASTERNODE);
      for (const signedMasternodeTx of signedMasternodeTxs) {
        this.logger.info('resign masternode', signedMasternodeTx.id);
        try {
          await this.api.resignMasternode(signedMasternodeTx);
        } catch (e) {
          this.logger.error('Sending resign masternode ERROR:', e);
        }
      }
    }
  }

  async handleResigning(masternodes: Masternode[]): Promise<void> {
    this.logger.info('payouts to make', masternodes.length);
    for (const masternode of masternodes) {
      const response: SignedTxPayload = await this.communication.query(Operation.PAYOUT_ALL, {
        index: masternode.accountIndex,
      });
      try {
        if (!response.isError) await this.api.resignedMasternode({ id: masternode.id, signedTx: response.signedTx });
      } catch (e) {
        this.logger.error('Sending resigned masternode ERROR:', e);
      }
    }
  }

  async signMasternodes(infos: RawTxMasternodeDto[], type: TxType): Promise<SignedMasternodeTxDto[]> {
    this.logger.info('masternodes to sign', infos.length);

    const result: SignedMasternodeTxDto[] = [];
    for (const info of infos) {
      const payload: SignTxPayload = {
        index: info.accountIndex,
        type,
        hex: info.rawTx.hex,
        prevouts: info.rawTx.prevouts,
        scriptHex: info.rawTx.scriptHex,
        apiSignature: info.apiSignature,
        masternodeSignature: info.apiSignature, // TODO (Krysh) setup own node on masternode manager to do self signing & blockchain checks
      };
      const response: SignedTxPayload = await this.communication.query(Operation.SIGN_TX, payload);
      if (!response.isError) {
        result.push({
          id: info.id,
          signedTx: response.signedTx,
        });
      }
    }
    return result;
  }
}

async function _fetch(method: Method, url: string, body?: string): Promise<ResponseAsString> {
  const response = await fetch(url, {
    method: method,
    headers: method !== 'GET' ? { 'Content-Type': 'application/json' } : {},
    body: body,
    cache: 'no-cache',
  });

  return {
    status: response.status,
    body: await response.text(),
  };
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
