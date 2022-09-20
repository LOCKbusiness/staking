class ConfigClass {
  liquidityWalletAddress = process.env.LIQUIDITY_WALLET_ADDRESS ?? '';
  masternodeWalletAddress = process.env.MASTERNODE_WALLET_ADDRESS ?? '';
  payoutWalletAddress = process.env.PAYOUT_WALLET_ADDRESS ?? '';

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
  };

  masternode = {
    collateral: 20000,
    fee: 10,

    resignMessage(mnId: number, creationHash: string): string {
      return `Resign masternode ${mnId} with hash ${creationHash}`;
    },
  };
}

const Config = new ConfigClass();
export default Config;
