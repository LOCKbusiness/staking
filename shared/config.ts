import { config } from 'dotenv';

interface WalletConfig {
  name: string;
  addressCount: number;
  seed: {
    length: 12 | 15 | 18 | 21 | 24;
    shareCount: number;
    thresholdCount: number;
    readFilePath: (share: number) => string;
    writeFilePath: (share: number) => string;
  };
}

class ConfigClass {
  api = {
    url: process.env.API_URL,
  };

  signature = {
    api: process.env.API_SIGN_ADDRESS ?? '',
    transactionChecker: process.env.TRANSACTION_CHECKER_ADDRESS ?? '',
    allowedMessages: [
      /^(?:cfp|dfip)-\d+-\d+-(?:yes|no|neutral)$/,
      /By_signing_this_message,_you_confirm_to_LOCK_that_you_are_the_sole_owner_of_the_provided_Blockchain_address._Your_ID:_.*/,
    ],
  };

  ocean = {
    url: process.env.OCEAN_URL,
    version: process.env.OCEAN_VERSION,
  };

  defichain = {
    network: process.env.CHAIN_NETWORK,
  };

  wallet: WalletConfig = {
    name: process.env.WALLET_NAME ?? '',
    addressCount: 1000,
    seed: {
      length: 24,
      shareCount: 3,
      thresholdCount: 2,
      readFilePath: (share: number) => `${process.env.SEED_FILE_PATH}${share}/share.shamir`,
      writeFilePath: (share: number) => `shares/share${share}/share.shamir`,
    },
  };

  communication = {
    serialPath: process.env.SERIAL_PATH ?? '',
  };
}

config();
const Config = new ConfigClass();
export default Config;
