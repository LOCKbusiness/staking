import { Validator } from '../validator';

describe('Validator', () => {
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
});
