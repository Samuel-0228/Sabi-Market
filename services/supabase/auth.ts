
import { supabase } from './client';

export const authService = {
  async signUp(email, password, metadata) {
    // Attempt sign up. This may trigger an email verification if enabled in Supabase.
    const response = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: metadata,
        emailRedirectTo: window.location.origin
      }
    });
    return response;
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
    // Upsert profile record. Requires active session if RLS is strict.
    return await supabase.from('profiles').upsert(profile);
  }
};
