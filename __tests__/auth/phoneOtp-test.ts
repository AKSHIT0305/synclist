import { isValidOtp, parsePhoneNumber } from '@/features/auth/phoneOtp';

jest.mock('@/lib/supabase', () => ({ getSupabase: jest.fn() }));

describe('parsePhoneNumber', () => {
  it('normalises formatted numbers to E.164', () => {
    expect(parsePhoneNumber('+91 98765-43210')).toEqual({ ok: true, e164: '+919876543210' });
    expect(parsePhoneNumber('+1 (415) 555-0100')).toEqual({ ok: true, e164: '+14155550100' });
  });

  it('requires a country code instead of guessing one', () => {
    const result = parsePhoneNumber('9876543210');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/country code/);
  });

  it('rejects numbers that are too short, too long or contain letters', () => {
    expect(parsePhoneNumber('+91123').ok).toBe(false);
    expect(parsePhoneNumber('+1234567890123456').ok).toBe(false);
    expect(parsePhoneNumber('+91 98765 ABCDE').ok).toBe(false);
    expect(parsePhoneNumber('+0123456789').ok).toBe(false);
  });
});

describe('isValidOtp', () => {
  it('accepts exactly six digits', () => {
    expect(isValidOtp('123456')).toBe(true);
    expect(isValidOtp(' 123456 ')).toBe(true);
    expect(isValidOtp('12345')).toBe(false);
    expect(isValidOtp('1234567')).toBe(false);
    expect(isValidOtp('12a456')).toBe(false);
  });
});
