import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from './Text';
import { useTheme } from './theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
  accessibilityLabel?: string;
  testID?: string;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const theme = useTheme();
  const inactive = disabled || loading;

  const background =
    variant === 'primary'
      ? theme.colors.primary
      : variant === 'danger'
        ? theme.colors.danger
        : variant === 'secondary'
          ? theme.colors.card
          : 'transparent';
  const foreground =
    variant === 'primary' || variant === 'danger' ? theme.colors.onPrimary : theme.colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: background,
          borderRadius: theme.radius.md,
          borderColor: theme.colors.border,
          borderWidth: variant === 'secondary' ? StyleSheet.hairlineWidth : 0,
          opacity: inactive ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text variant="label" style={{ color: foreground }}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 52, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
