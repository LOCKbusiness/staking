import { exit } from 'process';
import { Api } from '../gateway/api/api';
import { ColdWalletCommunication } from '../gateway/communication/cold-wallet-communication';
import { ICommunication, CommunicationType } from '../shared/communication/base/communication.interface';
import { Operation, SignedMessagePayload, SignMessagePayload } from '../shared/communication/dto/operation';
import { Util } from '../shared/util';

class App {
  private readonly roundId = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
  private readonly signaturesFileName = `voting/signatures_${this.roundId}.txt`;

  private readonly communication: ICommunication;
  private readonly api: Api;

  constructor() {
    this.communication = ColdWalletCommunication.create(CommunicationType.SERIAL);
    this.api = new Api();
  }

  async run(): Promise<void> {
    await this.setupNeededComponents();

    const cfpList = await this.api.getCfpVotingMessages();
    Util.writeFileRaw(this.signaturesFileName, '');

    let i = 1;
    for (const cfp of cfpList) {
      console.log(`Signing votes for ${cfp.name} (${i}/${cfpList.length})`);
      const cfpSignatures = [];
      for (const vote of cfp.votes) {
        const response = await this.communication.query<SignMessagePayload, SignedMessagePayload>(
          Operation.SIGN_MESSAGE,
          { accountIndex: vote.accountIndex, message: vote.message },
        );
        if (response.isError) throw new Error(`Failed to sign message ${vote.message} on account ${vote.accountIndex}`);

        cfpSignatures.push(`signmessage ${vote.address} ${vote.message}\n${response.signedMessage}`);
      }

      Util.appendFileRaw(this.signaturesFileName, cfpSignatures.join('\n') + '\n\n');
      i++;
    }
  }

  async setupNeededComponents(): Promise<void> {
    try {
      await this.communication.connect();

      // get wallet name
      const walletName: string = await this.communication.query(Operation.RECEIVE_WALLET_NAME);
      console.info('Connected to wallet', walletName);

      // get API login credentials
      const address: string = await this.communication.query(Operation.RECEIVE_ADDRESS);
      const message = await this.api.getSignMessage(address);
      const result: SignedMessagePayload = await this.communication.query(Operation.SIGN_MESSAGE, {
        message,
        accountIndex: 0,
      });

      this.api.setAuthentication({ address, signature: result.signedMessage });
    } catch (e) {
      await this.communication.disconnect();
      console.error(`Exception while setting up needed components:`, e);
      throw e;
    }
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
