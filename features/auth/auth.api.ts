import { authService } from '../../services/supabase/auth';
import { UserProfile } from '../../types';
import { db } from '../../services/supabase/db';
import { supabase } from '../../services/supabase/client';

export const authApi = {
  async register(email: string, password: string, fullName: string, preferences: string[]) {
    const { data, error } = await authService.signUp(email, password, { 
      full_name: fullName, 
      preferences 
    });
    
    if (error) throw error;
    if (!data.user) throw new Error("Registration failed to create a user.");
    
    return {
      user: data.user,
      session: data.session,
      needsConfirmation: data.user && !data.session
    };
  },

  async login(email: string, password: string) {
    const { data, error } = await authService.signIn(email, password);
    if (error) throw error;
    if (!data.session) throw new Error("Login failed: No session established.");
    return data;
  },

  async logout() {
    try {
      await authService.signOut();
    } catch (e) {
      console.warn("Sign out cleanup:", e);
    } finally {
      localStorage.clear();
      window.location.reload();
    }
  },

  async syncProfile(): Promise<UserProfile | null> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user) {
      const { data: { user: authUser } } = await authService.getUser();
      if (!authUser) return null;
      return this.syncProfile(); // Re-check with the actual user object
    }

    const userId = user.id;

    // Retry loop: Wait for the Postgres trigger to create the profile row
    let attempts = 0;
    while (attempts < 10) {
      const { data, error } = await authService.getProfile(userId);
      if (data && !error) return data as UserProfile;
      
      await new Promise(r => setTimeout(r, 800));
      attempts++;
    }

    // High-Fidelity Manual Fallback
    const fallback: UserProfile = {
      id: userId,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || 'Savvy Student',
      role: 'student',
      is_verified: user.email?.endsWith('@aau.edu.et') || false,
      preferences: user.user_metadata?.preferences || [],
      created_at: user.created_at || new Date().toISOString()
    };
    
    try {
      await authService.upsertProfile(fallback);
      return fallback;
    } catch (e) {
      console.error("Critical Profile Sync Failure:", e);
      return fallback; // Return local representation so app doesn't hang
    }
  }
};