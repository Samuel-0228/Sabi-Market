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
      // Allow session to settle
      await new Promise(r => setTimeout(r, 300));
      
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

      // If session exists but profile fetch failed, use a very minimal fallback
      const minimalUser: UserProfile = {
        id: session.user.id,
        email: session.user.email || '',
        full_name: session.user.user_metadata?.full_name || 'Student',
        role: 'student',
        is_verified: false,
        created_at: new Date().toISOString()
      };
      
      set({ user: minimalUser, loading: false, initialized: true });
      return minimalUser;
    } catch (e) {
      console.error("Global Auth Sync Error:", e);
      set({ user: null, loading: false, initialized: true });
      return null;
    }
  }
}));