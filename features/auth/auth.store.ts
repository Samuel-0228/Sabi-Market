import { create } from 'zustand';
import { UserProfile } from '../../types';
import { supabase } from '../../shared/lib/supabase';
import { authApi } from './auth.api';

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: UserProfile | null) => void;
  sync: () => Promise<UserProfile | null>;
  forceInitialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user, loading: false, initialized: true }),
  forceInitialize: () => set({ initialized: true, loading: false }),
  sync: async () => {
    set({ loading: true });
    try {
      // Small buffer for session persistence
      await new Promise(r => setTimeout(r, 200));
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        set({ user: null, loading: false, initialized: true });
        return null;
      }
      
      const profile = await authApi.syncProfile();
      
      if (profile) {
        set({ user: profile, loading: false, initialized: true });
        return profile;
      }

      set({ user: null, loading: false, initialized: true });
      return null;
    } catch (e) {
      console.error("Auth sync failed", e);
      set({ user: null, loading: false, initialized: true });
      return null;
    }
  }
}));