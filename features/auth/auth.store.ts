
import { create } from 'zustand';
import { UserProfile } from '../../types';
import { supabase } from '../../shared/lib/supabase';

interface AuthState {
  user: UserProfile | null;
  initialized: boolean;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
  sync: () => Promise<UserProfile | null>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,
  loading: false,
  setUser: (user) => set({ user, initialized: true, loading: false }),
  sync: async () => {
    set({ loading: true });
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        set({ user: null, initialized: true, loading: false });
        return null;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      const finalUser: UserProfile = (profile as UserProfile) || {
        id: session.user.id,
        email: session.user.email || '',
        full_name: session.user.user_metadata?.full_name || 'AAU Student',
        role: 'student',
        is_verified: session.user.email?.endsWith('@aau.edu.et') || false,
        created_at: session.user.created_at
      };

      set({ user: finalUser, initialized: true, loading: false });
      return finalUser;
    } catch (e) {
      set({ user: null, initialized: true, loading: false });
      return null;
    }
  }
}));
