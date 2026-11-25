import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

export type SessionStatus = 'loading' | 'signedOut' | 'signedIn';

type AuthState = {
  status: SessionStatus;
  session: Session | null;
  setSession: (session: Session | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  session: null,
  setSession: (session) => set({ session, status: session ? 'signedIn' : 'signedOut' }),
}));

export const selectUserId = (state: AuthState): string | null => state.session?.user.id ?? null;
