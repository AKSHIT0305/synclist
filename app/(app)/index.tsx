import { router } from 'expo-router';

import { ListsHomeScreen } from '@/features/lists/ListsHomeScreen';
import { useMyProfile } from '@/features/profile/useMyProfile';

export default function ListsHomeRoute() {
  const profile = useMyProfile().data;
  // Phase 2 replaces the empty array with lists from the local SQLite repository.
  return (
    <ListsHomeScreen
      lists={[]}
      me={{ name: profile?.display_name ?? '', avatarUrl: profile?.avatar_url ?? null }}
      onOpenSettings={() => router.push('/settings')}
    />
  );
}
