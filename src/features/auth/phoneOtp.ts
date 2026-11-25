import { getSupabase } from '@/lib/supabase';

/**
 * Phone OTP sign-in. Disabled by default (EXPO_PUBLIC_ENABLE_PHONE_OTP=false) because it needs a
 * paid SMS provider (Twilio / MSG91) configured in Supabase > Auth > Phone.
 */

export type PhoneParseResult = { ok: true; e164: string } | { ok: false; error: string };

/** Pure: accepts "+91 98765-43210" style input and returns E.164 ("+919876543210"). */
export function parsePhoneNumber(input: string): PhoneParseResult {
  const compact = input.replace(/[\s().-]/g, '');
  if (!compact.startsWith('+')) {
    return { ok: false, error: 'Include your country code, e.g. +91 98765 43210' };
  }
  if (!/^\+[1-9]\d{7,14}$/.test(compact)) {
    return { ok: false, error: 'That doesn’t look like a valid phone number' };
  }
  return { ok: true, e164: compact };
}

/** Pure: 6-digit codes only. */
export function isValidOtp(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}

export async function sendPhoneOtp(e164: string): Promise<string | null> {
  const { error } = await getSupabase().auth.signInWithOtp({ phone: e164 });
  return error ? error.message : null;
}

export async function verifyPhoneOtp(e164: string, code: string): Promise<string | null> {
  const { error } = await getSupabase().auth.verifyOtp({
    phone: e164,
    token: code.trim(),
    type: 'sms',
  });
  return error ? error.message : null;
}
