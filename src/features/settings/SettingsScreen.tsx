import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { signOut } from '@/features/auth/signOut';
import { useMyProfile } from '@/features/profile/useMyProfile';
import { Avatar, Button, Card, Text } from '@/ui';

/** Phase 1: profile summary + sign out. Notifications, theme and delete account come later. */
export function SettingsScreen() {
  const profile = useMyProfile().data;
  const [busy, setBusy] = useState(false);

  const onSignOut = async () => {
    setBusy(true);
    try {
      await signOut();
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card style={styles.profile}>
        <Avatar name={profile?.display_name ?? ''} uri={profile?.avatar_url} size={56} />
        <View style={styles.flex}>
          <Text variant="label">{profile?.display_name}</Text>
          <Text variant="caption" muted>
            Signed in
          </Text>
        </View>
      </Card>
      <Button
        title="Sign out"
        variant="secondary"
        onPress={() => void onSignOut()}
        loading={busy}
        testID="sign-out"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  flex: { flex: 1 },
});
