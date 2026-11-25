import { ScrollView, StyleSheet } from 'react-native';

import type { EnvError } from '@/lib/env';
import { Card, Screen, Text } from '@/ui';

/** Shown instead of the app when required EXPO_PUBLIC_* values are missing or malformed. */
export function ConfigErrorScreen({ error }: { error: EnvError }) {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="title">Setup needed</Text>
        <Text muted>
          SyncList is missing some configuration. Copy .env.example to .env, fill in the values, and
          restart the dev server (npx expo start --dev-client --clear).
        </Text>
        <Card style={styles.card}>
          {error.issues.map((issue) => (
            <Text key={issue} variant="caption">
              • {issue}
            </Text>
          ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 32, gap: 16 },
  card: { gap: 6 },
});
