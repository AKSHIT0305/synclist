import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import { selectUserId, useAuthStore } from '@/features/auth/authStore';
import { Avatar, Button, Screen, Text, TextField, useTheme } from '@/ui';

import { pickAvatar } from './pickAvatar';
import { uploadAvatar } from './profileApi';
import { useMyProfile, useUpdateMyProfile } from './useMyProfile';
import { DISPLAY_NAME_MAX, validateDisplayName } from './validateDisplayName';

/** Onboarding step 1: confirm name (prefilled from Google) and optionally set a photo. */
export function ProfileSetupScreen() {
  const theme = useTheme();
  const userId = useAuthStore(selectUserId);
  const profile = useMyProfile().data;
  const updateProfile = useUpdateMyProfile();

  const [name, setName] = useState(profile?.display_name ?? '');
  const [localAvatar, setLocalAvatar] = useState<{ uri: string; mimeType: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const avatarUri = localAvatar?.uri ?? profile?.avatar_url ?? null;

  const onPickPhoto = async () => {
    try {
      const picked = await pickAvatar();
      if (picked) setLocalAvatar(picked);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open your photos');
    }
  };

  const onContinue = async () => {
    const validated = validateDisplayName(name);
    if (!validated.ok) return setError(validated.error);
    if (!userId) return;

    setSaving(true);
    setError(null);
    try {
      const avatarUrl = localAvatar
        ? await uploadAvatar(userId, localAvatar.uri, localAvatar.mimeType)
        : (profile?.avatar_url ?? null);
      // Setting onboarded_at moves the router to the next onboarding step.
      await updateProfile.mutateAsync({
        display_name: validated.value,
        avatar_url: avatarUrl,
        onboarded_at: new Date().toISOString(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile');
      setSaving(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.top}>
            <Text variant="title">How should people see you?</Text>
            <Text muted>
              Your name and photo show on shared lists and next to tasks you tick off.
            </Text>
          </View>

          <Pressable
            onPress={() => void onPickPhoto()}
            accessibilityRole="button"
            accessibilityLabel="Choose a profile photo"
            style={styles.avatarButton}
            testID="pick-avatar"
          >
            <Avatar name={name || '?'} uri={avatarUri} size={112} />
            <Text variant="caption" style={{ color: theme.colors.primary }}>
              {avatarUri ? 'Change photo' : 'Add a photo'}
            </Text>
          </Pressable>

          <TextField
            label="Your name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (error) setError(null);
            }}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            maxLength={DISPLAY_NAME_MAX}
            returnKeyType="done"
            onSubmitEditing={() => void onContinue()}
            error={error}
            testID="display-name"
          />

          <Button
            title="Continue"
            onPress={() => void onContinue()}
            loading={saving}
            style={styles.continue}
            testID="profile-continue"
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, gap: 24, paddingTop: 32, paddingBottom: 24 },
  top: { gap: 8 },
  avatarButton: { alignSelf: 'center', alignItems: 'center', gap: 8 },
  continue: { marginTop: 'auto' },
});
