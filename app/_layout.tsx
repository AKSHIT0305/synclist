import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme as NavTheme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthBootstrap } from '@/features/auth/useAuthBootstrap';
import { useAuthRoute } from '@/features/auth/useAuthRoute';
import { ConfigErrorScreen } from '@/features/system/ConfigErrorScreen';
import { ProfileErrorScreen } from '@/features/system/ProfileErrorScreen';
import { EnvError, getEnv } from '@/lib/env';
import { queryClient } from '@/lib/queryClient';
import { useTheme } from '@/ui';

void SplashScreen.preventAutoHideAsync();

function readEnvError(): EnvError | null {
  try {
    getEnv();
    return null;
  } catch (error) {
    return error instanceof EnvError ? error : new EnvError([String(error)]);
  }
}

export default function RootLayout() {
  const [envError] = useState(readEnvError);
  const theme = useTheme();

  const navTheme = useMemo<NavTheme>(() => {
    const base = theme.dark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.card,
        text: theme.colors.text,
        border: theme.colors.border,
      },
    };
  }, [theme]);

  useEffect(() => {
    if (envError) void SplashScreen.hideAsync();
  }, [envError]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={navTheme}>
          <StatusBar style={theme.dark ? 'light' : 'dark'} />
          {envError ? (
            <ConfigErrorScreen error={envError} />
          ) : (
            <QueryClientProvider client={queryClient}>
              <RootNavigator />
            </QueryClientProvider>
          )}
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * One navigator, three protected groups. The current AuthRoute decides which group is
 * reachable; Expo Router redirects automatically when a guard flips (e.g. after sign-in).
 */
function RootNavigator() {
  useAuthBootstrap();
  const route = useAuthRoute();

  useEffect(() => {
    if (route !== 'loading') void SplashScreen.hideAsync();
  }, [route]);

  if (route === 'loading') return null; // splash screen stays visible
  if (route === 'error') return <ProfileErrorScreen />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={route === 'sign-in'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={route === 'profile' || route === 'widget-intro'}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={route === 'home'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}
