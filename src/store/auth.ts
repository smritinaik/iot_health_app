import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  ready: boolean;
  init: () => () => void;
}

export const useAuth = create<AuthState>((set) => ({
  session: null,
  ready: false,
  init: () => {
    supabase.auth.getSession().then(({ data }) => set({ session: data.session, ready: true }));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => set({ session }));
    return () => data.subscription.unsubscribe();
  },
}));