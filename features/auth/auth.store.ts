
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
    
    // Safety Race: Ensure the sync never takes longer than 6 seconds
    const timeoutPromise = new Promise<null>((resolve) => 
      setTimeout(() => {
        console.warn("Auth sync timed out, forcing initialization fallback");
        resolve(null);
      }, 6000)
    );

    const syncPromise = (async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session fetch error:", sessionError);
          return null;
        }

        if (!session) {
          return null;
        }
        
        // Track visit and update points
        await db.incrementVisitCount(session.user.id);
        
        // Award first login achievement
        await db.awardAchievement(session.user.id, 'first_login');
        
        const profile = await authApi.syncProfile();
        
        if (profile) {
          return profile;
        }

        // Minimal fallback profile if session exists but database profile is missing
        return {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || 'Student',
          role: 'student',
          is_verified: session.user.email?.endsWith('@aau.edu.et') || false,
          created_at: session.user.created_at || new Date().toISOString()
        } as UserProfile;
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
