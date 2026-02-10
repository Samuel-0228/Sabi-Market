
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

    // Retry loop to wait for the Postgres trigger to create the profile row
    let attempts = 0;
    while (attempts < 8) {
      const profile = await db.getProfile(user.id);
      if (profile) return profile;
      
      await new Promise(r => setTimeout(r, 600));
      attempts++;
    }

    // Fallback if trigger is extremely slow
    const fallback: UserProfile = {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || 'Savvy Student',
      role: 'student',
      is_verified: user.email?.endsWith('@aau.edu.et') || false,
      preferences: user.user_metadata?.preferences || [],
      created_at: new Date().toISOString()
    };
    await authService.upsertProfile(fallback);
    return fallback;
  }
};
