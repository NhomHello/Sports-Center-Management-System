import { describe, expect, it } from 'vitest';
import {
  normalizeAccountFields,
  normalizeOwnProfilePayload,
  normalizeRegistrationPayload,
} from './account';

describe('account payload normalization', () => {
  it('trims the name and phone and lowercases email', () => {
    expect(
      normalizeAccountFields({
        fullName: '  An Nguyen ',
        email: ' AN@EXAMPLE.COM ',
        phone: ' 0912345678 ',
      }),
    ).toEqual({
      fullName: 'An Nguyen',
      email: 'an@example.com',
      phone: '0912345678',
    });
  });

  it('omits empty optional contact fields', () => {
    expect(normalizeAccountFields({ fullName: 'An Nguyen', email: ' ', phone: ' ' })).toEqual({
      fullName: 'An Nguyen',
    });
  });

  it('does not send the confirmation field', () => {
    expect(
      normalizeRegistrationPayload({
        fullName: ' An ',
        email: 'AN@example.com',
        phone: '',
        password: 'a-secure-password',
        confirmPassword: 'a-secure-password',
      }),
    ).toEqual({ fullName: 'An', email: 'an@example.com', password: 'a-secure-password' });
  });

  it('sends null when the optional profile phone is cleared', () => {
    expect(
      normalizeOwnProfilePayload({ fullName: ' An ', email: ' AN@example.com ', phone: ' ' }),
    ).toEqual({ fullName: 'An', email: 'an@example.com', phone: null });
  });
});
