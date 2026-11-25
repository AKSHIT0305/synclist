import { EnvError, parseEnv, type RawEnv } from '@/lib/env';

const valid: RawEnv = {
  EXPO_PUBLIC_SUPABASE_URL: 'https://abcdefghijklmnop.supabase.co',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_0123456789abcdefghij',
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: '1234567890-abc123.apps.googleusercontent.com',
};

describe('parseEnv', () => {
  it('maps valid values and defaults phone OTP to off', () => {
    expect(parseEnv(valid)).toEqual({
      supabaseUrl: 'https://abcdefghijklmnop.supabase.co',
      supabaseAnonKey: 'sb_publishable_0123456789abcdefghij',
      googleWebClientId: '1234567890-abc123.apps.googleusercontent.com',
      enablePhoneOtp: false,
    });
  });

  it('turns phone OTP on only for the exact string "true"', () => {
    expect(parseEnv({ ...valid, EXPO_PUBLIC_ENABLE_PHONE_OTP: 'true' }).enablePhoneOtp).toBe(true);
    expect(parseEnv({ ...valid, EXPO_PUBLIC_ENABLE_PHONE_OTP: 'false' }).enablePhoneOtp).toBe(
      false,
    );
    expect(() => parseEnv({ ...valid, EXPO_PUBLIC_ENABLE_PHONE_OTP: 'yes' })).toThrow(EnvError);
  });

  it('reports every missing value at once', () => {
    try {
      parseEnv({});
      throw new Error('expected parseEnv to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(EnvError);
      const issues = (error as EnvError).issues.join('\n');
      expect(issues).toContain('EXPO_PUBLIC_SUPABASE_URL');
      expect(issues).toContain('EXPO_PUBLIC_SUPABASE_ANON_KEY');
      expect(issues).toContain('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
    }
  });

  it('rejects an Android/iOS client id where the web client id belongs', () => {
    expect(() =>
      parseEnv({ ...valid, EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: 'com.akshit.synclist' }),
    ).toThrow(/Web application/);
  });

  it('rejects a malformed Supabase URL', () => {
    expect(() => parseEnv({ ...valid, EXPO_PUBLIC_SUPABASE_URL: 'not a url' })).toThrow(EnvError);
  });
});
