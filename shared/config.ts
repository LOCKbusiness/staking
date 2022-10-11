import { config } from 'dotenv';

class ConfigClass {
  api = {
    url: process.env.API_URL,
    address: process.env.API_ADDRESS,
    signature: process.env.API_SIGNATURE,
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

  wallet = {
    name: 'cold-wallet-a',
    // TODO (Krysh) will be removed by an own backup & restore handling
    seed: process.env.TEMPORARY_SEED,
  };
}

config();
const Config = new ConfigClass();
export default Config;
