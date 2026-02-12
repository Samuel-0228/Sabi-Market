
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
    
    // Safety Race: Ensure the sync never takes longer than 6 seconds
    const timeoutPromise = new Promise<null>((resolve) => 
      setTimeout(() => {
        console.warn("Auth sync timed out, forcing initialization fallback");
        resolve(null);
      }, 6000)
    );

    const syncPromise = (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          return null;
        }
        
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
