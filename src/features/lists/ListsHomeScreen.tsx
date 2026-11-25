import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Card, EmptyState, Screen, Text, useTheme } from '@/ui';

import type { ListSummary } from './types';

export type ListsHomeScreenProps = {
  lists: ListSummary[];
  me: { name: string; avatarUrl: string | null };
  onOpenSettings: () => void;
  /** Undefined until Phase 2 wires up list creation; the button renders disabled. */
  onCreateList?: () => void;
};

export function ListsHomeScreen({ lists, me, onOpenSettings, onCreateList }: ListsHomeScreenProps) {
  const theme = useTheme();
  const canCreate = onCreateList !== undefined;

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <Text variant="title" accessibilityRole="header">
          Your lists
        </Text>
        <Pressable
          onPress={onOpenSettings}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          hitSlop={8}
          testID="open-settings"
        >
          <Avatar name={me.name} uri={me.avatarUrl} size={36} />
        </Pressable>
      </View>

      <FlatList
        data={lists}
        keyExtractor={(list) => list.id}
        contentContainerStyle={lists.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <EmptyState
            emoji="📝"
            title="No lists yet"
            message="Create a list for groceries, chores or a trip, then share it with the people who help."
          />
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={[styles.emojiBadge, { backgroundColor: item.color + '22' }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text variant="label">{item.name}</Text>
              <Text variant="caption" muted>
                {item.openCount === 0 ? 'All done 🎉' : `${item.openCount} open`}
              </Text>
            </View>
          </Card>
        )}
      />

      <Pressable
        onPress={onCreateList}
        disabled={!canCreate}
        accessibilityRole="button"
        accessibilityLabel="Create list"
        accessibilityState={{ disabled: !canCreate }}
        testID="create-list"
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
            opacity: !canCreate ? 0.45 : pressed ? 0.85 : 1,
          },
        ]}
      >
        <Text style={[styles.fabGlyph, { color: theme.colors.onPrimary }]}>+</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 16,
  },
  emptyContainer: { flexGrow: 1 },
  listContent: { gap: 12, paddingBottom: 120 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  emojiBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 26 },
  cardBody: { flex: 1, gap: 2 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 32,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabGlyph: { fontSize: 32, lineHeight: 34, fontWeight: '400' },
});
