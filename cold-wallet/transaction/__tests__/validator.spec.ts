import { Validator } from '../validator';
import { CTransactionSegWit, Script } from '@defichain/jellyfish-transaction';
import { fromAddress } from '@defichain/jellyfish-address';
import { SmartBuffer } from 'smart-buffer';
import { TestNet } from '@defichain/jellyfish-network';

describe('Validator', () => {
  const receiveScriptOf = (address: string): Script | undefined => {
    const decodedAddress = fromAddress(address, TestNet.name);
    return decodedAddress?.script;
  };

  const receiveTxOf = (hex: string): CTransactionSegWit => {
    return new CTransactionSegWit(SmartBuffer.fromBuffer(Buffer.from(hex, 'hex')));
  };

  it('should return true for message cfp-2208-12-yes', () => {
    expect(Validator.isMessageAllowed('cfp-2208-12-yes')).toBeTruthy();
  });

  it('should return true for message By_signing_this_message,_you_confirm_to_LOCK_that_you_are_the_sole_owner_of_the_provided_Blockchain_address._Your_ID:_asdf', () => {
    expect(
      Validator.isMessageAllowed(
        'By_signing_this_message,_you_confirm_to_LOCK_that_you_are_the_sole_owner_of_the_provided_Blockchain_address._Your_ID:_asdf',
      ),
    ).toBeTruthy();
  });

  it('should return false for message some test', () => {
    expect(Validator.isMessageAllowed('some test')).toBeFalsy();
  });

  it('should verify composite swap without DFI', () => {
    const tx = receiveTxOf(
      '0400000000010183cad82aa5ae10dc77a12b6f812cf9ade892912d285bc6e9538237cd204e68ab0100000000ffffffff020000000000000000516a4c4e4466547869160014233b41533e850221bc97c46d62da13f3ff7b9b440d808d5b0000000000160014233b41533e850221bc97c46d62da13f3ff7b9b440b40420f0000000000000000000000000000008a66231800000000160014233b41533e850221bc97c46d62da13f3ff7b9b44000114233b41533e850221bc97c46d62da13f3ff7b9b4400000000',
    );
    const script = receiveScriptOf('tf1qyva5z5e7s5pzr0yhc3kk9ksn70lhhx6yxyuv2e');
    const txType = 'OP_DEFI_TX_COMPOSITE_SWAP';

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(Validator.isAllowed(tx, script!, script!, txType)).toBeTruthy();
  });

  it('should deny composite swap with DFI from', () => {
    const tx = receiveTxOf(
      '040000000001011f349daa4aa85b2d119c972ec064c86a0ba18bdd7d883da56e4e4cd60fecb7db0100000000ffffffff020000000000000000516a4c4e4466547869160014233b41533e850221bc97c46d62da13f3ff7b9b4400808d5b0000000000160014233b41533e850221bc97c46d62da13f3ff7b9b440d40420f000000000000000000000000000000d1b9eb0b00000000160014233b41533e850221bc97c46d62da13f3ff7b9b44000114233b41533e850221bc97c46d62da13f3ff7b9b4400000000',
    );
    const script = receiveScriptOf('tf1qyva5z5e7s5pzr0yhc3kk9ksn70lhhx6yxyuv2e');
    const txType = 'OP_DEFI_TX_COMPOSITE_SWAP';

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(Validator.isAllowed(tx, script!, script!, txType)).toBeFalsy();
  });

  it('should deny composite swap with DFI to', () => {
    const tx = receiveTxOf(
      '040000000001019ab3c60b578c1c31efbea1ddc29019867cc57f22addb62173fbff7d77f7231340000000000ffffffff020000000000000000516a4c4e4466547869160014233b41533e850221bc97c46d62da13f3ff7b9b440d808d5b0000000000160014233b41533e850221bc97c46d62da13f3ff7b9b440040420f000000000000000000000000000000c7dff50500000000160014233b41533e850221bc97c46d62da13f3ff7b9b44000114233b41533e850221bc97c46d62da13f3ff7b9b4400000000',
    );
    const script = receiveScriptOf('tf1qyva5z5e7s5pzr0yhc3kk9ksn70lhhx6yxyuv2e');
    const txType = 'OP_DEFI_TX_COMPOSITE_SWAP';

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(Validator.isAllowed(tx, script!, script!, txType)).toBeFalsy();
  });

  it('should verify withdraw from vault', () => {
    const tx = receiveTxOf(
      '0400000000010110b7d84fcf10c8a34e643ec1212dbd4fa0ee1215eaea84841b94da68a7023f710100000000ffffffff020000000000000000476a45446654784a703c5311b23356782d0adb475acded68ed6f0a1157b9515787202091e0955479160014233b41533e850221bc97c46d62da13f3ff7b9b440b00ca9a3b0000000000b44caa5f00000000160014233b41533e850221bc97c46d62da13f3ff7b9b44000114233b41533e850221bc97c46d62da13f3ff7b9b4400000000',
    );
    const script = receiveScriptOf('tf1qyva5z5e7s5pzr0yhc3kk9ksn70lhhx6yxyuv2e');
    const txType = 'OP_DEFI_TX_WITHDRAW_FROM_VAULT';

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(Validator.isAllowed(tx, script!, script!, txType)).toBeTruthy();
  });

  it('should allow a vote without change script', () => {
    const tx = receiveTxOf(
      '04000000000101a4f9f60d4a61750d4b75e3c21dd203ed38ce4077e2e29dd7c094a21f5ce9be230000000000ffffffff010000000000000000486a46446654784f24eebd46843c778d855dc593c58a86d84193412c30aa8b84b92eb5957b80fbf9ded5125a4ab6b0b63a6a28b00140a83c5debd80051c7f3168941943ec1259115010001143faf3d07e5fa516122195bacd67a7436180b750200000000',
    );
    const liqScript = receiveScriptOf('tf1qyva5z5e7s5pzr0yhc3kk9ksn70lhhx6yxyuv2e');
    const script = receiveScriptOf('tf1q87hn6pl9lfgkzgsetwkdv7n5xcvqkagztha6yn');
    const txType = 'OP_DEFI_TX_VOTE';

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(Validator.isAllowed(tx, script!, liqScript!, txType)).toBeTruthy();
  });

  it('should allow a vote with change script', () => {
    const tx = receiveTxOf(
      '04000000000101a4f9f60d4a61750d4b75e3c21dd203ed38ce4077e2e29dd7c094a21f5ce9be230000000000ffffffff020000000000000000486a46446654784f24eebd46843c778d855dc593c58a86d84193412c30aa8b84b92eb5957b80fbf9ded5125a4ab6b0b63a6a28b00140a83c5debd80051c7f3168941943ec1259115030027eae4e4d10100001600143faf3d07e5fa516122195bacd67a7436180b75020001143faf3d07e5fa516122195bacd67a7436180b750200000000',
    );
    const liqScript = receiveScriptOf('tf1qyva5z5e7s5pzr0yhc3kk9ksn70lhhx6yxyuv2e');
    const script = receiveScriptOf('tf1q87hn6pl9lfgkzgsetwkdv7n5xcvqkagztha6yn');
    const txType = 'OP_DEFI_TX_VOTE';

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(Validator.isAllowed(tx, script!, liqScript!, txType)).toBeTruthy();
  });
});
