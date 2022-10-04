import { exit } from 'process';
import { WalletHelper } from './wallet-helper';

enum ExportType {
  SQL = 'sql',
  JSON = 'json',
}

const buildJSON = (index: number, address: string, wallet: string, accountIndex: number): string => {
  return `{ "id": ${index}, "owner": "${address}", "ownerWallet": "${wallet}", "accountIndex": ${accountIndex} }\n`;
};

const buildSQL = (index: number, address: string, wallet: string, accountIndex: number): string => {
  return `UPDATE table_name SET owner = '${address}', ownerWallet = '${wallet}', accountIndex = ${accountIndex} WHERE id = ${index}\n`;
};

const generate = async (
  walletName: string,
  numberOfAddresses: number,
  startingIndex: number,
  accountIndex: number,
  exportType: ExportType,
) => {
  const wallet = await WalletHelper.restore();
  wallet.initialize();

  let result = '';

  for (let i = 0; i < numberOfAddresses; i++) {
    // in our new setup it doesn't matter if default address is used or not
    // as it isn't used as collector address anymore
    const address = await wallet.getAddress(accountIndex + i);
    switch (exportType) {
      case ExportType.SQL:
        result += buildSQL(startingIndex + i, address, walletName, accountIndex + i);
        break;
      case ExportType.JSON:
        result += buildJSON(startingIndex + i, address, walletName, accountIndex + i);
        break;
    }
  }

  console.log(result);
};

const args = process.argv.splice(2);
const amountOfArguments = 5;

if (args.length < amountOfArguments || args.length > amountOfArguments) {
  console.log(
    'Usage: npm run new-addresses <wallet name> <amount of addresses> <starting api index> <starting account index> <export type>',
  );
  console.log('  <wallet name>: name of the owner wallet');
  console.log('  <amount of addresses>: numeric value on how many addresses should be generated');
  console.log('  <starting api index>: masternode index (API id)');
  console.log('  <starting account index>: account index (wallet account index)');
  console.log('  <export type>: sql or json');
  exit(0);
}

const ARG_WALLET = 0;
const ARG_ADDRESS = 1;
const ARG_API_INDEX = 2;
const ARG_ACCOUNT_INDEX = 3;
const ARG_EXPORT_TYPE = 4;

const walletName = args[ARG_WALLET];
const numberOfAddresses = +args[ARG_ADDRESS];
const startingIndex = +args[ARG_API_INDEX];
const accountIndex = +args[ARG_ACCOUNT_INDEX];
const exportType = args[ARG_EXPORT_TYPE] as ExportType;

if (!Object.values(ExportType).includes(exportType)) {
  console.log(`ERROR: only ${Object.values(ExportType).join(', ')} are possible export types`);
  exit(0);
}

console.log('generating new addresses');
console.log('  for wallet: ', walletName);
console.log('  amount: ', numberOfAddresses);
console.log('  starting at index: ', startingIndex);
console.log('  export type: ', exportType);
console.log('\n');

generate(walletName, numberOfAddresses, startingIndex, accountIndex, exportType);
