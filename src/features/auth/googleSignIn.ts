import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { getEnv } from '@/lib/env';
import { getSupabase } from '@/lib/supabase';

export type SignInResult =
  { kind: 'success' } | { kind: 'cancelled' } | { kind: 'error'; message: string };

let configured = false;

function ensureConfigured(): void {
  if (configured) return;
  GoogleSignin.configure({ webClientId: getEnv().googleWebClientId });
  configured = true;
}

/** Native Google sign-in → Google ID token → Supabase session. */
export async function signInWithGoogle(): Promise<SignInResult> {
  try {
    ensureConfigured();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return { kind: 'cancelled' };

    const idToken = response.data.idToken;
    if (!idToken) {
      return {
        kind: 'error',
        message: 'Google did not return an ID token. Check the web client id.',
      };
    }

    const { error } = await getSupabase().auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) return { kind: 'error', message: error.message };
    return { kind: 'success' };
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.IN_PROGRESS) return { kind: 'cancelled' };
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { kind: 'error', message: 'Google Play Services is not available on this device.' };
      }
    }
    return {
      kind: 'error',
      message: error instanceof Error ? error.message : 'Google sign-in failed.',
    };
  }
}

export async function signOutOfGoogle(): Promise<void> {
  try {
    ensureConfigured();
    await GoogleSignin.signOut();
  } catch {
    // Not signed in with Google (e.g. phone sign-in) — nothing to do.
  }
}
