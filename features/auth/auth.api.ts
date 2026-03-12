
import { authService } from '../../services/supabase/auth';
import { UserProfile } from '../../types';
import { supabase } from '../../services/supabase/client';

export const authApi = {
  async register(email: string, password: string, fullName: string, preferences: string[]) {
    const { data, error } = await authService.signUp(email, password, { 
      full_name: fullName, 
      preferences 
    });
    
    if (error) throw error;
    if (!data.user) throw new Error("Registration failed to create a user.");

    // Manual profile creation to ensure preferences are stored correctly
    // This acts as a fallback if the Supabase trigger is missing or failing
    try {
      await authService.upsertProfile({
        id: data.user.id,
        email: email,
        full_name: fullName,
        preferences: preferences,
        role: 'student',
        is_verified: email.endsWith('@aau.edu.et'),
        created_at: new Date().toISOString()
      });
    } catch (upsertError) {
      console.warn("Initial profile upsert failed, relying on trigger:", upsertError);
    }
    
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
      // Immediate re-check if the session call returned null but might still be hydrating
      const { data: { user: authUser } } = await authService.getUser();
      if (!authUser) return null;
      // Use the authUser directly to save a recursive call
      return this._fetchProfileWithRetries(authUser);
    }

    return this._fetchProfileWithRetries(user);
  },

  async _fetchProfileWithRetries(user: any): Promise<UserProfile> {
    const userId = user.id;
    let attempts = 0;
    const maxAttempts = 2; // Faster feedback for missing profiles

    while (attempts < maxAttempts) {
      try {
        const { data, error } = await authService.getProfile(userId);
        if (data && !error) return data as UserProfile;
      } catch (e) {
        console.warn("Profile fetch attempt failed:", e);
      }
      
      await new Promise(r => setTimeout(r, 500));
      attempts++;
    }

    // High-Fidelity Manual Fallback: Ensure user data is returned even if DB fetch fails
    const fallback: UserProfile = {
      id: userId,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || 'Savvy Student',
      role: 'student',
      is_verified: user.email?.endsWith('@aau.edu.et') || false,
      preferences: user.user_metadata?.preferences || [],
      created_at: user.created_at || new Date().toISOString(),
      points: 0,
      level: 1,
      login_streak: 0,
      visit_count: 0
    };
    
    try {
      // Fire-and-forget upsert to try and heal the database state
      authService.upsertProfile(fallback).catch(e => console.warn("Background profile heal failed:", e));
      return fallback;
    } catch (e) {
      return fallback;
    }
  },

  async requestPasswordReset(email: string) {
    const { error } = await authService.resetPassword(email);
    if (error) throw error;
    return true;
  },

  async updatePassword(password: string) {
    const { error } = await authService.updatePassword(password);
    if (error) throw error;
    return true;
  },

  async getGoogleAuthUrl() {
    const { data, error } = await authService.getGoogleAuthUrl();
    if (error) throw error;
    return data.url;
  }
};
