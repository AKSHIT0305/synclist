import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { useMyProfile } from '@/features/profile/useMyProfile';

import { useAuthStore } from './authStore';
import { resolveAuthRoute, type AuthRoute } from './resolveAuthRoute';

export function useAuthRoute(): AuthRoute {
  const session = useAuthStore((s) => s.status);
  const widgetIntroSeen = useOnboardingStore((s) => s.widgetIntroSeen);
  const profileQuery = useMyProfile();

  const profile =
    session !== 'signedIn'
      ? undefined
      : profileQuery.data
        ? { onboardedAt: profileQuery.data.onboarded_at }
        : profileQuery.isError
          ? null
          : undefined;

  return resolveAuthRoute({ session, profile, widgetIntroSeen });
}
