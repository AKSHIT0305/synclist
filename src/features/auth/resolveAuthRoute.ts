/** Where the app should be, given the auth/onboarding state. Pure and unit-tested. */
export type AuthRoute = 'loading' | 'error' | 'sign-in' | 'profile' | 'widget-intro' | 'home';

export type AuthRouteInput = {
  session: 'loading' | 'signedOut' | 'signedIn';
  /** Undefined while the profile has not loaded yet. Null if loading it failed with nothing cached. */
  profile: { onboardedAt: string | null } | null | undefined;
  /** Null while the device flag is being read. */
  widgetIntroSeen: boolean | null;
};

export function resolveAuthRoute({ session, profile, widgetIntroSeen }: AuthRouteInput): AuthRoute {
  if (session === 'loading') return 'loading';
  if (session === 'signedOut') return 'sign-in';
  if (profile === undefined) return 'loading';
  if (profile === null) return 'error';
  if (!profile.onboardedAt) return 'profile';
  if (widgetIntroSeen === null) return 'loading';
  if (!widgetIntroSeen) return 'widget-intro';
  return 'home';
}
