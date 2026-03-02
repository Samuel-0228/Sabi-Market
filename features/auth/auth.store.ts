
import { create } from 'zustand';
import { UserProfile } from '../../types';
import { supabase } from '../../services/supabase/client';
import { db } from '../../services/supabase/db';
import { authApi } from './auth.api';

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: UserProfile | null) => void;
  sync: () => Promise<UserProfile | null>;
  forceInitialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user, loading: false, initialized: true }),
  forceInitialize: () => set({ initialized: true, loading: false }),
  sync: async () => {
    // If we're already loading and not in the initial state, don't re-sync
    if (get().loading && get().initialized) return get().user;
    
    set({ loading: true });
    
    // Safety Race: Ensure the sync never takes longer than 10 seconds
    const timeoutPromise = new Promise<null>((resolve) => 
      setTimeout(() => {
        console.warn("Auth sync timed out, forcing initialization fallback");
        resolve(null);
      }, 10000)
    );

    const syncPromise = (async () => {
      try {
        let session = null;
        let attempts = 0;
        
        // Retry session fetch up to 3 times with small delays
        while (attempts < 3) {
          const { data: { session: s }, error: sessionError } = await supabase.auth.getSession();
          if (s && !sessionError) {
            session = s;
            break;
          }
          if (sessionError) console.warn("Session fetch attempt failed:", sessionError);
          await new Promise(r => setTimeout(r, 500));
          attempts++;
        }
        
        // Fallback to getUser if session is still null
        if (!session) {
          const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
          if (!authUser || userError) {
            console.error("No session and getUser failed:", userError);
            return null;
          }
          // If we have a user but no session object, we can still proceed with profile sync
          const profile = await authApi.syncProfile();
          return profile;
        }
        
        // Track visit and award achievements in background to prevent blocking the initial sync
        const userId = session.user.id;
        (async () => {
          try {
            await db.incrementVisitCount(userId);
            await db.awardAchievement(userId, 'first_login');
          } catch (e) {
            console.warn("Background auth tracking failed:", e);
          }
        })();
        
        const profile = await authApi.syncProfile();
        return profile;
      } catch (e) {
        console.error("Auth sync internal error:", e);
        return null;
      }
    })();

    const result = await Promise.race([syncPromise, timeoutPromise]);
    
    set({ 
      user: result, 
      loading: false, 
      initialized: true 
    });
    
    return result;
  }
}));
