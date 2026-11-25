import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { palette } from './theme';

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

export type AvatarProps = { name: string; uri?: string | null; size?: number; color?: string };

export function Avatar({ name, uri, size = 40, color = palette.blue }: AvatarProps) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={dimension}
        contentFit="cover"
        accessibilityLabel={`${name}'s avatar`}
        transition={150}
      />
    );
  }
  return (
    <View
      style={[styles.fallback, dimension, { backgroundColor: color }]}
      accessibilityLabel={`${name}'s avatar`}
    >
      <Text style={{ color: '#FFFFFF', fontSize: size * 0.4, fontWeight: '600' }}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
