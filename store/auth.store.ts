
import { create } from 'https://esm.sh/zustand';
import { UserProfile } from '../types';
import { coreClient } from '../services/supabase/coreClient';

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
  sync: () => Promise<UserProfile | null>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  sync: async () => {
    const { data: { user } } = await coreClient.auth.getUser();
    if (!user) {
      set({ user: null, loading: false });
      return null;
    }
    const { data: profile } = await coreClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    const finalUser = profile as UserProfile || { 
      id: user.id, 
      email: user.email, 
      full_name: user.user_metadata?.full_name || 'Student',
      role: 'student' 
    };
    set({ user: finalUser, loading: false });
    return finalUser;
  }
}));
