import { resolveAuthRoute, type AuthRouteInput } from '@/features/auth/resolveAuthRoute';

const onboarded = { onboardedAt: '2026-11-25T10:00:00Z' };

function route(overrides: Partial<AuthRouteInput>) {
  return resolveAuthRoute({
    session: 'signedIn',
    profile: onboarded,
    widgetIntroSeen: true,
    ...overrides,
  });
}

describe('resolveAuthRoute', () => {
  it('waits while the stored session is being restored', () => {
    expect(route({ session: 'loading', profile: undefined, widgetIntroSeen: null })).toBe(
      'loading',
    );
  });

  it('sends signed-out users to sign-in, whatever else is known', () => {
    expect(route({ session: 'signedOut' })).toBe('sign-in');
    expect(route({ session: 'signedOut', profile: undefined, widgetIntroSeen: null })).toBe(
      'sign-in',
    );
  });

  it('waits for the profile after sign-in', () => {
    expect(route({ profile: undefined })).toBe('loading');
  });

  it('shows an error when the profile could not be loaded and nothing is cached', () => {
    expect(route({ profile: null })).toBe('error');
  });

  it('asks for a profile until onboarding is completed', () => {
    expect(route({ profile: { onboardedAt: null } })).toBe('profile');
    // even if the widget intro was already seen on this device (e.g. a second account)
    expect(route({ profile: { onboardedAt: null }, widgetIntroSeen: true })).toBe('profile');
  });

  it('shows the widget intro once per device', () => {
    expect(route({ widgetIntroSeen: false })).toBe('widget-intro');
    expect(route({ widgetIntroSeen: null })).toBe('loading');
  });

  it('lands on home when everything is done', () => {
    expect(route({})).toBe('home');
  });
});
