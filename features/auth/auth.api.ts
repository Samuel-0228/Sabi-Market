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
    try {
      await authService.signOut();
    } catch (e) {
      console.warn("Sign out cleanup:", e);
    } finally {
      localStorage.clear();
      window.location.href = '/';
    }
  },

  async syncProfile(): Promise<UserProfile | null> {
    const { data: { user } } = await authService.getUser();
    if (!user) return null;

    // Optimized retry loop to wait for the SQL trigger to create the profile row
    let attempts = 0;
    while (attempts < 5) {
      const profile = await db.getProfile(user.id);
      if (profile) return profile;
      
      await new Promise(r => setTimeout(r, 500));
      attempts++;
    }

    // High-Fidelity Fallback Profile if trigger is delayed
    const fallback: UserProfile = {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || 'Savvy Student',
      role: 'student',
      is_verified: user.email?.endsWith('@aau.edu.et') || false,
      preferences: user.user_metadata?.preferences || [],
      created_at: new Date().toISOString()
    };
    
    // Attempt manual sync to DB
    try {
      await authService.upsertProfile(fallback);
    } catch (e) {
      console.warn("DB Background Sync Delayed:", e);
    }
    
    return fallback;
  }
};