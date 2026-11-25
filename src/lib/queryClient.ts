import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      // Offline-first: local data is the source of truth (Phase 2+), so don't refetch eagerly.
      networkMode: 'offlineFirst',
    },
    mutations: { networkMode: 'offlineFirst' },
  },
});

// Refetch stale queries when the app returns to the foreground.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (status) => focusManager.setFocused(status === 'active'));
}
