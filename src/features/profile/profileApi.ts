import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Tables } from '@/lib/database.types';
import { getSupabase } from '@/lib/supabase';

export type Profile = Tables<'profiles'>;

/** Explicit columns: push_tokens is not readable by clients, so `select('*')` would be denied. */
export const PROFILE_COLUMNS =
  'id, display_name, avatar_url, onboarded_at, created_at, updated_at, deleted_at';

const CACHE_PREFIX = 'synclist.profile.';

/**
 * Loads the signed-in user's profile. The last good copy is cached on device so the app
 * still opens offline; it is only used when the network request fails.
 */
export async function fetchMyProfile(userId: string): Promise<Profile> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();

  if (!error && data) {
    await AsyncStorage.setItem(CACHE_PREFIX + userId, JSON.stringify(data));
    return data;
  }

  const cached = await AsyncStorage.getItem(CACHE_PREFIX + userId);
  if (cached) return JSON.parse(cached) as Profile;
  throw new Error(error?.message ?? 'Your profile could not be found.');
}

export type ProfileUpdate = {
  display_name?: string;
  avatar_url?: string | null;
  onboarded_at?: string;
};

export async function updateMyProfile(userId: string, patch: ProfileUpdate): Promise<Profile> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select(PROFILE_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  await AsyncStorage.setItem(CACHE_PREFIX + userId, JSON.stringify(data));
  return data;
}

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Uploads to avatars/<uid>/<timestamp>.<ext> and returns the public URL. */
export async function uploadAvatar(userId: string, uri: string, mimeType: string): Promise<string> {
  const contentType = mimeType in EXTENSIONS ? mimeType : 'image/jpeg';
  const path = `${userId}/${Date.now()}.${EXTENSIONS[contentType] ?? 'jpg'}`;
  const body = await (await fetch(uri)).arrayBuffer();

  const storage = getSupabase().storage.from('avatars');
  const { error } = await storage.upload(path, body, { contentType, upsert: false });
  if (error) throw new Error(error.message);
  return storage.getPublicUrl(path).data.publicUrl;
}

export async function clearCachedProfiles(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const ours = keys.filter((k) => k.startsWith(CACHE_PREFIX));
  if (ours.length > 0) await AsyncStorage.multiRemove(ours);
}
