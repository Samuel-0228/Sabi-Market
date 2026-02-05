
import { supabase } from './client';

export const authService = {
  async signUp(email, password, metadata) {
    return await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: metadata,
        emailRedirectTo: window.location.origin
      }
    });
  },
  async signIn(email, password) {
    return await supabase.auth.signInWithPassword({ email, password });
  },
  async signOut() {
    return await supabase.auth.signOut();
  },
  async getUser() {
    return await supabase.auth.getUser();
  },
  async getProfile(userId) {
    return await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  },
  async upsertProfile(profile) {
    return await supabase.from('profiles').upsert(profile);
  }
};
