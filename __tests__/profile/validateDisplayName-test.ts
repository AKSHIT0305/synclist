import { initialsOf } from '@/ui/Avatar';
import { validateDisplayName } from '@/features/profile/validateDisplayName';

describe('validateDisplayName', () => {
  it('trims and collapses whitespace', () => {
    expect(validateDisplayName('  Riya   Sharma ')).toEqual({ ok: true, value: 'Riya Sharma' });
  });

  it('rejects empty names', () => {
    expect(validateDisplayName('   ')).toEqual({ ok: false, error: 'Please enter your name' });
  });

  it('enforces the 60 character database limit', () => {
    expect(validateDisplayName('a'.repeat(60)).ok).toBe(true);
    expect(validateDisplayName('a'.repeat(61)).ok).toBe(false);
  });
});

describe('initialsOf', () => {
  it('uses first and last initials', () => {
    expect(initialsOf('riya sharma')).toBe('RS');
    expect(initialsOf('Ana Maria de la Cruz')).toBe('AC');
    expect(initialsOf('Akshit')).toBe('A');
    expect(initialsOf('   ')).toBe('?');
  });
});
