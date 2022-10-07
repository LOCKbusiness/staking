import { config } from 'dotenv';

interface WalletConfig {
  name: string;
  addressCount: number;
  seed: {
    length: 12 | 15 | 18 | 21 | 24;
    shareCount: number;
    thresholdCount: number;
  };
}

class ConfigClass {
  api = {
    url: process.env.API_URL,
    address: process.env.API_ADDRESS,
    signature: process.env.API_SIGNATURE,
  };

  liquidity = {
    walletAddress: process.env.LIQUIDITY_WALLET_ADDRESS ?? '',
    signatureAddress: process.env.LIQUIDITY_SIGNATURE_ADDRESS ?? '',
  };

  masternode = {
    collateral: 20000,
    fee: 10,

    signatureAddress: process.env.MASTERNODE_SIGNATURE_ADDRESS ?? '',
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
    },
  };
}

config();
const Config = new ConfigClass();
export default Config;
