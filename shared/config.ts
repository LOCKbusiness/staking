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
  };

  masternode = {
    collateral: 20000,
    fee: 10,
  };

  ocean = {
    url: process.env.OCEAN_URL,
    version: process.env.OCEAN_VERSION,
  };

  defichain = {
    network: process.env.CHAIN_NETWORK,
  };

  wallet: WalletConfig = {
    name: 'cold-wallet-a',
    addressCount: 1000,
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
