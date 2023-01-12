import { config } from 'dotenv';
import { machineIdSync } from 'node-machine-id';
import { version } from '../package.json';

interface WalletConfig {
  name: string;
  seed: {
    length: 12 | 15 | 18 | 21 | 24;
    shareCount: number;
    thresholdCount: number;
    readFilePath: (share: number) => string;
    writeFilePath: (share: number) => string;
  };
}

class ConfigClass {
  deviceId = machineIdSync();
  version = version;
  unlockPin = process.env.UNLOCK_PIN;

  logger = {
    role: 'lock-transaction-signer',
    instance: this.deviceId,
    printConsole: true,
    printFile: true,
    filePath: process.env.LOG_FILE_PATH ?? 'staking.log',
  };

  api = {
    url: process.env.API_URL,
    pollInterval: 15, // seconds
  };

  signature = {
    api: process.env.API_SIGN_ADDRESS ?? '',
    transactionChecker: process.env.TRANSACTION_CHECKER_ADDRESS ?? '',
    allowedMessages: [
      /^(?:cfp|dfip)-\d+-\w+-(?:yes|no|neutral)$/,
      /By_signing_this_message,_you_confirm_to_LOCK_that_you_are_the_sole_owner_of_the_provided_Blockchain_address._Your_ID:_.*/,
    ],
  };

  defichain = {
    network: process.env.CHAIN_NETWORK,
  };

  wallet: WalletConfig = {
    name: process.env.WALLET_NAME ?? '',
    seed: {
      length: 24,
      shareCount: 3,
      thresholdCount: 2,
      readFilePath: (share: number) => `${process.env.SEED_FILE_PATH}${share}/share.shamir`,
      writeFilePath: (share: number) => `shares/share${share}/share.shamir`,
    },
  };
}

config();
const Config = new ConfigClass();
export default Config;
