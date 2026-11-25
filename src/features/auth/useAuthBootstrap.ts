import { useEffect } from 'react';

import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { getSupabase } from '@/lib/supabase';

import { useAuthStore } from './authStore';

/** Restores the persisted session, then keeps the auth store in sync with Supabase. */
export function useAuthBootstrap(): void {
  const setSession = useAuthStore((s) => s.setSession);
  const loadWidgetIntroSeen = useOnboardingStore((s) => s.load);

  useEffect(() => {
    const supabase = getSupabase();
    let active = true;

    void loadWidgetIntroSeen();

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSession(data.session);
      })
      .catch(() => {
        if (active) setSession(null);
      });

    // Don't call other supabase methods synchronously inside this callback (supabase-js warns
    // it can deadlock); we only update the store, and queries react to it.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setSession(session);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [setSession, loadWidgetIntroSeen]);
}
