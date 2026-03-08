
import { create } from 'zustand';
import { UserProfile } from '../../types';
import { supabase } from '../../services/supabase/client';
import { db } from '../../services/supabase/db';
import { authApi } from './auth.api';

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  syncing: boolean;
  setUser: (user: UserProfile | null) => void;
  sync: (providedSession?: any) => Promise<UserProfile | null>;
  forceInitialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,
  syncing: false,
  setUser: (user) => set({ user, loading: false, initialized: true, syncing: false }),
  forceInitialize: () => set({ initialized: true, loading: false, syncing: false }),
  sync: async (providedSession) => {
    if (get().syncing && !providedSession) return get().user;
    
    set({ loading: true, syncing: true });
    
    try {
      let session = providedSession || null;
      
      if (!session) {
        const { data: { session: s }, error: sessionError } = await supabase.auth.getSession();
        if (s && !sessionError) {
          session = s;
        }
      }
      
      if (!session) {
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        if (!authUser || userError) {
          set({ user: null, loading: false, initialized: true, syncing: false });
          return null;
        }
      }
      
      const profile = await authApi.syncProfile();
      
      if (profile) {
        const userId = profile.id;
        (async () => {
          try {
            await db.incrementVisitCount(userId);
            await db.awardAchievement(userId, 'first_login');
          } catch (e) {
            console.warn("Background auth tracking failed:", e);
          }
        })();
      }

      set({ 
        user: profile, 
        loading: false, 
        initialized: true,
        syncing: false
      });
      
      return profile;
    } catch (e) {
      console.error("Auth sync internal error:", e);
      set({ user: null, loading: false, initialized: true, syncing: false });
      return null;
    } finally {
      set({ syncing: false, loading: false, initialized: true });
    }
  }
}));
