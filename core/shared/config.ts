import { config } from 'dotenv';

class ConfigClass {
  api = {
    url: process.env.API_URL,
    address: process.env.API_ADDRESS,
    signature: process.env.API_SIGNATURE,
  };

  node = {
    auth: process.env.NODE_RPC_AUTH ?? '',
  };

  liquidity = {
    min: 20000,
    max: 40000,

    walletAddress: process.env.LIQUIDITY_WALLET_ADDRESS ?? '',
  };

  masternode = {
    collateral: 20000,
    fee: 10,

    resignMessage(mnId: number, creationHash: string): string {
      return `Resign masternode ${mnId} with hash ${creationHash}`;
    },
  };

  ocean = {
    url: process.env.OCEAN_URL,
    version: process.env.OCEAN_VERSION,
  };

  defichain = {
    network: process.env.CHAIN_NETWORK,
  };

  wallet = {
    name: 'cold-wallet-a',
  };

  withdrawalMessage(amount: number, asset: string, address: string): string {
    return `Withdraw ${amount} ${asset} to ${address}`;
  }
}

config();
const Config = new ConfigClass();
export default Config;
