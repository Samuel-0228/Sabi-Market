
import { create } from 'https://esm.sh/zustand@4.5.2?deps=react@19.0.0';
import { UserProfile } from '../types';
import { supabase } from '../services/supabase/client';

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  sync: () => Promise<UserProfile | null>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  sync: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ user: null, loading: false });
        return null;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      const finalUser: UserProfile = (profile as UserProfile) || { 
        id: user.id, 
        email: user.email || '', 
        full_name: user.user_metadata?.full_name || 'Student',
        role: 'student',
        is_verified: user.email?.endsWith('@aau.edu.et') || false,
        created_at: user.created_at
      };
      
      set({ user: finalUser, loading: false });
      return finalUser;
    } catch (e) {
      console.error("Auth sync failed", e);
      set({ user: null, loading: false });
      return null;
    }
  }
}));
