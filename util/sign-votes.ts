import { exit } from 'process';
import { ColdWalletCommunication } from '../gateway/communication/cold-wallet-communication';
import { ICommunication, CommunicationType } from '../shared/communication/base/communication.interface';
import { Operation, SignedMessagePayload, SignMessagePayload } from '../shared/communication/dto/operation';
import { Util } from '../shared/util';

interface Cfp {
  name: string;
  votes: { accountIndex: number; address: string; message: string }[];
}

class App {
  private readonly votesFileName = 'votes.json';
  private readonly signaturesFileName = 'signatures.txt';

  private readonly communication: ICommunication;

  constructor() {
    this.communication = ColdWalletCommunication.create(CommunicationType.SERIAL);
  }

  async run(): Promise<void> {
    await this.setupNeededComponents();

    const cfpList = Util.readFile<Cfp[]>(this.votesFileName);
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
