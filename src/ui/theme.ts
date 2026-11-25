import { useColorScheme } from 'react-native';

export const palette = {
  blue: '#208AEF',
  green: '#22A06B',
  red: '#E5484D',
  amber: '#F5A524',
} as const;

/** Accent colours a list can use (Phase 2 list editor). */
export const listAccentColors = [
  '#208AEF',
  '#22A06B',
  '#E5484D',
  '#F5A524',
  '#8E4EC6',
  '#E93D82',
  '#12A594',
  '#6E56CF',
] as const;

export type Theme = {
  dark: boolean;
  colors: {
    background: string;
    card: string;
    cardPressed: string;
    text: string;
    textMuted: string;
    border: string;
    primary: string;
    onPrimary: string;
    danger: string;
    overlay: string;
  };
  radius: { sm: number; md: number; lg: number; pill: number };
  spacing: (n: number) => number;
};

const shared = {
  radius: { sm: 8, md: 14, lg: 22, pill: 999 },
  spacing: (n: number) => n * 4,
};

export const lightTheme: Theme = {
  dark: false,
  colors: {
    background: '#F4F6FA',
    card: '#FFFFFF',
    cardPressed: '#EEF1F6',
    text: '#11181C',
    textMuted: '#687076',
    border: '#E3E7ED',
    primary: palette.blue,
    onPrimary: '#FFFFFF',
    danger: palette.red,
    overlay: 'rgba(0,0,0,0.35)',
  },
  ...shared,
};

export const darkTheme: Theme = {
  dark: true,
  colors: {
    background: '#0E1116',
    card: '#191D24',
    cardPressed: '#222731',
    text: '#ECEDEE',
    textMuted: '#9BA1A6',
    border: '#2A303A',
    primary: '#3C9CF5',
    onPrimary: '#FFFFFF',
    danger: '#F2555A',
    overlay: 'rgba(0,0,0,0.55)',
  },
  ...shared,
};

/** Follows the system theme. (A user override is added with Settings in a later phase.) */
export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? darkTheme : lightTheme;
}
