import 'react-native-url-polyfill/auto';

import { createClient, processLock, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, type AppStateStatus } from 'react-native';

import type { Database } from './database.types';
import { getEnv } from './env';
import { LargeSecureStore } from './largeSecureStore';

export type AppSupabaseClient = SupabaseClient<Database>;

let client: AppSupabaseClient | undefined;

/** Lazily created so tests and the config-error screen can load without real env values. */
export function getSupabase(): AppSupabaseClient {
  if (!client) {
    const env = getEnv();
    client = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        storage: new LargeSecureStore(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: processLock,
      },
    });
    registerAutoRefresh(client);
  }
  return client;
}

/**
 * React Native has no "page visibility", so supabase-js can't tell when the app is backgrounded.
 * Refresh tokens only while the app is in the foreground.
 */
function registerAutoRefresh(supabase: AppSupabaseClient): void {
  const onChange = (state: AppStateStatus) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  };
  AppState.addEventListener('change', onChange);
  onChange(AppState.currentState === 'active' ? 'active' : 'background');
}
