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
    // Attempt to get user from session first to be faster
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user) {
      const { data: { user: authUser } } = await authService.getUser();
      if (!authUser) return null;
    }

    const userId = user?.id || (await authService.getUser()).data.user?.id;
    if (!userId) return null;

    // Retry fetching the profile to account for SQL trigger delay
    let attempts = 0;
    let profile = null;
    
    while (attempts < 5) {
      const { data } = await authService.getProfile(userId);
      if (data) {
        profile = data as UserProfile;
        break;
      }
      await new Promise(r => setTimeout(r, 800)); // Slightly longer wait for SQL triggers
      attempts++;
    }

    if (profile) return profile;

    // High-Fidelity Fallback if trigger hasn't finished
    const authData = user || (await authService.getUser()).data.user;
    const fallback: UserProfile = {
      id: userId,
      email: authData?.email || '',
      full_name: authData?.user_metadata?.full_name || 'Savvy Student',
      role: 'student',
      is_verified: authData?.email?.endsWith('@aau.edu.et') || false,
      preferences: authData?.user_metadata?.preferences || [],
      created_at: authData?.created_at || new Date().toISOString()
    };
    
    try {
      await authService.upsertProfile(fallback);
    } catch (e) {
      console.warn("Manual profile sync failed:", e);
    }
    
    return fallback;
  }
};