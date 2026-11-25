import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from './theme';

export type ScreenProps = { children: ReactNode; style?: ViewStyle; edges?: Edge[] };

export function Screen({ children, style, edges = ['top', 'bottom'] }: ScreenProps) {
  const theme = useTheme();
  return (
    <SafeAreaView edges={edges} style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.content, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20 },
});
