import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { getEnv } from '@/lib/env';
import { Button, EmptyState, Screen, Text, TextField } from '@/ui';

import { isValidOtp, parsePhoneNumber, sendPhoneOtp, verifyPhoneOtp } from './phoneOtp';

/** Two steps: phone number → 6-digit code. Hidden unless EXPO_PUBLIC_ENABLE_PHONE_OTP=true. */
export function PhoneSignInScreen() {
  const [phone, setPhone] = useState('');
  const [e164, setE164] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!getEnv().enablePhoneOtp) {
    return (
      <Screen>
        <EmptyState
          emoji="📵"
          title="Phone sign-in is off"
          message="Use Google to sign in for now."
          action={<Button title="Back" onPress={() => router.back()} />}
        />
      </Screen>
    );
  }

  const onSend = async () => {
    const parsed = parsePhoneNumber(phone);
    if (!parsed.ok) return setError(parsed.error);
    setBusy(true);
    setError(null);
    const failure = await sendPhoneOtp(parsed.e164);
    setBusy(false);
    if (failure) return setError(failure);
    setE164(parsed.e164);
  };

  const onVerify = async () => {
    if (!e164) return;
    if (!isValidOtp(code)) return setError('Enter the 6-digit code');
    setBusy(true);
    setError(null);
    const failure = await verifyPhoneOtp(e164, code);
    setBusy(false);
    if (failure) setError(failure);
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.form}>
          <Text variant="title">{e164 ? 'Enter the code' : 'Your phone number'}</Text>
          {e164 ? (
            <>
              <Text muted>We sent a 6-digit code to {e164}.</Text>
              <TextField
                label="Code"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoComplete="sms-otp"
                textContentType="oneTimeCode"
                maxLength={6}
                autoFocus
                error={error}
              />
              <Button title="Verify" onPress={() => void onVerify()} loading={busy} />
              <Button
                title="Use a different number"
                variant="ghost"
                onPress={() => setE164(null)}
              />
            </>
          ) : (
            <>
              <TextField
                label="Phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
                placeholder="+91 98765 43210"
                autoFocus
                error={error}
              />
              <Button title="Send code" onPress={() => void onSend()} loading={busy} />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  form: { gap: 16, paddingTop: 32 },
});
