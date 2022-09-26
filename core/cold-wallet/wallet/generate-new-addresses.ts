import { exit } from 'process';
import { WalletHelper } from './wallet-helper';

enum ExportType {
  SQL = 'sql',
  JSON = 'json',
}

const buildJSON = (index: number, address: string, wallet: string): string => {
  return `{ "id": ${index}, "owner": "${address}", "ownerWallet": "${wallet}" }\n`;
};

const buildSQL = (index: number, address: string, wallet: string): string => {
  return `UPDATE table_name SET owner = ${address}, ownerWallet = ${wallet} WHERE id = ${index}\n`;
};

const generate = async (
  walletName: string,
  numberOfAddresses: number,
  startingIndex: number,
  exportType: ExportType,
) => {
  const wallet = await WalletHelper.restore();
  wallet.initialize();

  let result = '';

  for (let i = 0; i < numberOfAddresses; i++) {
    // in our new setup it doesn't matter if default address is used or not
    // as it isn't used as collector address anymore
    const address = await wallet.getAddress(i);
    switch (exportType) {
      case ExportType.SQL:
        result += buildSQL(startingIndex + i, address, walletName);
        break;
      case ExportType.JSON:
        result += buildJSON(startingIndex + i, address, walletName);
        break;
    }
  }

  console.log(result);
};

const args = process.argv.splice(2);

if (args.length < 4 || args.length > 4) {
  console.log('Usage: npm run new-addresses <wallet name> <amount of addresses> <starting index> <export type>');
  console.log('  <wallet name>: name of the owner wallet');
  console.log('  <amount of addresses>: numeric value on how many addresses should be generated');
  console.log('  <starting index>: 0-based index of masternode index');
  console.log('  <export type>: sql or json');
  exit(0);
}

const ARG_WALLET = 0;
const ARG_ADDRESS = 1;
const ARG_INDEX = 2;
const ARG_EXPORT_TYPE = 3;

const walletName = args[ARG_WALLET];
const numberOfAddresses = +args[ARG_ADDRESS];
const startingIndex = +args[ARG_INDEX];
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

generate(walletName, numberOfAddresses, startingIndex, exportType);
