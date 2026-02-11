
import { create } from 'zustand';
import { UserProfile } from '../types';
import { supabase } from '../services/supabase/client';

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  sync: () => Promise<UserProfile | null>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user, loading: false, initialized: true }),
  setLoading: (loading) => set({ loading }),
  sync: async () => {
    set({ loading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        set({ user: null, loading: false, initialized: true });
        return null;
      }
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      // Resilient profile recovery
      const finalUser: UserProfile = (profile as UserProfile) || { 
        id: session.user.id, 
        email: session.user.email || '', 
        full_name: session.user.user_metadata?.full_name || 'Student',
        role: 'student',
        is_verified: session.user.email?.endsWith('@aau.edu.et') || false,
        created_at: session.user.created_at
      };
      
      set({ user: finalUser, loading: false, initialized: true });
      return finalUser;
    } catch (e) {
      console.error("Auth sync failed", e);
      set({ user: null, loading: false, initialized: true });
      return null;
    }
  }
}));
