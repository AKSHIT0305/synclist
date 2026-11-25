import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { useTheme } from './theme';

type Variant = 'title' | 'heading' | 'body' | 'label' | 'caption';

const variants: Record<Variant, TextStyle> = {
  title: { fontSize: 30, fontWeight: '700', letterSpacing: -0.5 },
  heading: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22 },
  label: { fontSize: 15, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18 },
};

export type TextProps = RNTextProps & { variant?: Variant; muted?: boolean };

export function Text({ variant = 'body', muted = false, style, ...rest }: TextProps) {
  const theme = useTheme();
  return (
    <RNText
      style={[
        variants[variant],
        { color: muted ? theme.colors.textMuted : theme.colors.text },
        style,
      ]}
      {...rest}
    />
  );
}
