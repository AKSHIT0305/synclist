import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from './Text';

export type EmptyStateProps = {
  emoji: string;
  title: string;
  message?: string;
  action?: ReactNode;
};

export function EmptyState({ emoji, title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.container} accessibilityRole="summary">
      <Text style={styles.emoji} accessibilityElementsHidden importantForAccessibility="no">
        {emoji}
      </Text>
      <Text variant="heading" style={styles.center}>
        {title}
      </Text>
      {message ? (
        <Text muted style={styles.center}>
          {message}
        </Text>
      ) : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  emoji: { fontSize: 56, marginBottom: 8 },
  center: { textAlign: 'center' },
  action: { marginTop: 16, alignSelf: 'stretch' },
});
