
import { authService } from '../../services/supabase/auth';
import { UserProfile } from '../../types';
import { db } from '../../services/supabase/db';

export const authApi = {
  async register(email: string, password: string, fullName: string, preferences: string[]) {
    const { data, error } = await authService.signUp(email, password, { 
      full_name: fullName, 
      preferences 
    });
    if (error) throw error;
    
    return {
      user: data.user,
      session: data.session,
      needsConfirmation: data.user && !data.session
    };
  },

  async login(email: string, password: string) {
    const { data, error } = await authService.signIn(email, password);
    if (error) throw error;
    return data;
  },

  async logout() {
    await authService.signOut();
    localStorage.clear();
    window.location.reload();
  },

  async syncProfile(): Promise<UserProfile | null> {
    const { data: { user } } = await authService.getUser();
    if (!user) return null;

    // Faster retry loop: 10 attempts at 400ms = 4s total wait max
    let attempts = 0;
    while (attempts < 10) {
      const profile = await db.getProfile(user.id);
      if (profile) return profile;
      
      await new Promise(r => setTimeout(r, 400));
      attempts++;
    }

    // Fallback if trigger is extremely slow or fails to fire
    const fallback: UserProfile = {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || 'Savvy Student',
      role: 'student',
      is_verified: user.email?.endsWith('@aau.edu.et') || false,
      preferences: user.user_metadata?.preferences || [],
      created_at: new Date().toISOString()
    };
    
    try {
      await authService.upsertProfile(fallback);
    } catch (e) {
      console.warn("Silent profile upsert fallback failed", e);
    }
    
    return fallback;
  }
};
