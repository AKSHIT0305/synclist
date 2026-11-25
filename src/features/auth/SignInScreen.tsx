import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getEnv } from '@/lib/env';
import { Button, Screen, Text, useTheme } from '@/ui';

import { signInWithGoogle } from './googleSignIn';

export function SignInScreen() {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const phoneEnabled = getEnv().enablePhoneOtp;

  const onGoogle = async () => {
    setBusy(true);
    setError(null);
    const result = await signInWithGoogle();
    // On success the auth listener updates the store and the router moves on by itself.
    if (result.kind === 'error') setError(result.message);
    setBusy(false);
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.hero}>
        <View style={[styles.logo, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.logoGlyph}>✓</Text>
        </View>
        <Text variant="title">SyncList</Text>
        <Text muted style={styles.tagline}>
          Shared to-do lists that live on your home screen and stay in sync with everyone.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Continue with Google"
          onPress={() => void onGoogle()}
          loading={busy}
          testID="google-sign-in"
          icon={<Text style={[styles.gIcon, { color: theme.colors.onPrimary }]}>G</Text>}
        />
        {phoneEnabled ? (
          <Button
            title="Continue with phone"
            variant="secondary"
            disabled={busy}
            onPress={() => router.push('/phone')}
            testID="phone-sign-in"
          />
        ) : null}
        {error ? (
          <Text
            variant="caption"
            accessibilityRole="alert"
            style={[styles.error, { color: theme.colors.danger }]}
          >
            {error}
          </Text>
        ) : null}
        <Text variant="caption" muted style={styles.legal}>
          By continuing you agree to share your name and photo with people on your lists.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'space-between', paddingVertical: 32 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoGlyph: { fontSize: 48, color: '#FFFFFF', fontWeight: '700' },
  tagline: { textAlign: 'center', maxWidth: 300 },
  actions: { gap: 12 },
  gIcon: { fontSize: 18, fontWeight: '800' },
  error: { textAlign: 'center' },
  legal: { textAlign: 'center', marginTop: 4 },
});
