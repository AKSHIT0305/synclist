import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from './theme';

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius.lg,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderWidth: StyleSheet.hairlineWidth },
});
