import { Stack } from 'expo-router';

import { useAuthRoute } from '@/features/auth/useAuthRoute';

/** Profile setup first, then the widget prompt. Each step unlocks once the previous is done. */
export default function OnboardingLayout() {
  const route = useAuthRoute();
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Protected guard={route === 'profile'}>
        <Stack.Screen name="profile" />
      </Stack.Protected>
      <Stack.Protected guard={route === 'widget-intro'}>
        <Stack.Screen name="widget-intro" />
      </Stack.Protected>
    </Stack>
  );
}
