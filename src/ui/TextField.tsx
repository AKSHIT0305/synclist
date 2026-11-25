import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from './Text';
import { useTheme } from './theme';

export type TextFieldProps = TextInputProps & { label: string; error?: string | null };

export function TextField({ label, error, style, ...rest }: TextFieldProps) {
  const theme = useTheme();
  return (
    <View style={styles.wrapper}>
      <Text variant="caption" muted>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.colors.textMuted}
        style={[
          styles.input,
          {
            color: theme.colors.text,
            backgroundColor: theme.colors.card,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            borderRadius: theme.radius.md,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" style={{ color: theme.colors.danger }} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  input: { minHeight: 52, paddingHorizontal: 16, fontSize: 16, borderWidth: 1 },
});
