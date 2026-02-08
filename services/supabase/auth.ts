
import { supabase } from './client';

export const authService = {
  async signUp(email: string, password: string, metadata: any) {
    return await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: metadata,
        emailRedirectTo: window.location.origin
      }
    });
  },
  async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password });
  },
  async signOut() {
    return await supabase.auth.signOut();
  },
  async getUser() {
    return await supabase.auth.getUser();
  },
  async getProfile(userId: string) {
    return await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  },
  async upsertProfile(profile: any) {
    return await supabase.from('profiles').upsert(profile);
  }
};
