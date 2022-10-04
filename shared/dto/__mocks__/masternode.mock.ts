import { Masternode, MasternodeState } from '../masternode';

const defaultMasternode: Partial<Masternode> = {
  id: 1,
  state: MasternodeState.CREATED,
  creationHash: 'creation-hash',
};

export function createDefaultMasternode(): Masternode {
  return createCustomMasternode({});
}

export function createCustomMasternode(customValues: Partial<Masternode>): Masternode {
  return { ...defaultMasternode, ...customValues } as Masternode;
}
