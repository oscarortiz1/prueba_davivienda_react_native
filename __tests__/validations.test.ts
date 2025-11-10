import { validateEmail, validateName, validatePassword } from '../src/shared/utils/validations';

describe('validation helpers', () => {
  describe('validateEmail', () => {
    it('accepts common email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user+alias@domain.co')).toBe(true);
    });

    it('rejects malformed emails', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('missing@domain')).toBe(false);
      expect(validateEmail('@nouser.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('requires at least six characters', () => {
      expect(validatePassword('secret')).toBe(true);
      expect(validatePassword('short')).toBe(false);
    });
  });

  describe('validateName', () => {
    it('trims whitespace before checking length', () => {
      expect(validateName('Ana')).toBe(true);
      expect(validateName(' A ')).toBe(false);
    });
  });
});
