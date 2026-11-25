import { StyleSheet, View } from 'react-native';

import { signOut } from '@/features/auth/signOut';
import { useMyProfile } from '@/features/profile/useMyProfile';
import { Button, EmptyState, Screen } from '@/ui';

/** Signed in, but the profile couldn't be loaded and nothing is cached (e.g. first launch offline). */
export function ProfileErrorScreen() {
  const profile = useMyProfile();
  return (
    <Screen>
      <EmptyState
        emoji="📡"
        title="Can’t reach SyncList"
        message={
          profile.error?.message
            ? `We couldn’t load your profile: ${profile.error.message}`
            : 'We couldn’t load your profile. Check your connection and try again.'
        }
        action={
          <View style={styles.actions}>
            <Button
              title="Try again"
              loading={profile.isFetching}
              onPress={() => void profile.refetch()}
            />
            <Button title="Sign out" variant="ghost" onPress={() => void signOut()} />
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({ actions: { gap: 8 } });
