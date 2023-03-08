import Config from '../../shared/config';
import LocVaults from './vaults-loc.json';
import DevVaults from './vaults-dev.json';
import StgVaults from './vaults-stg.json';
import PrdVaults from './vaults-prd.json';

export class VaultReader {
  static read(): string[] {
    switch (Config.environment) {
      case 'loc':
        return LocVaults as string[];
      case 'dev':
        return DevVaults as string[];
      case 'stg':
        return StgVaults as string[];
      case 'prd':
        return PrdVaults as string[];
    }
    return [];
  }
}
