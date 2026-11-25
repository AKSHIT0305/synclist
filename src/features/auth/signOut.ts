import { clearCachedProfiles } from '@/features/profile/profileApi';
import { queryClient } from '@/lib/queryClient';
import { getSupabase } from '@/lib/supabase';

import { signOutOfGoogle } from './googleSignIn';

/**
 * Signs out everywhere on this device and drops cached user data.
 * Phase 2 adds: wipe the local SQLite database. Phase 4 adds: clear widget snapshots.
 */
export async function signOut(): Promise<void> {
  await signOutOfGoogle();
  await getSupabase().auth.signOut({ scope: 'local' });
  queryClient.clear();
  await clearCachedProfiles();
}
