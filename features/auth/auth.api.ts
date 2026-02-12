
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
    const maxAttempts = 6; // Reduced attempts for faster feedback

    while (attempts < maxAttempts) {
      const { data, error } = await authService.getProfile(userId);
      if (data && !error) return data as UserProfile;
      
      await new Promise(r => setTimeout(r, 600));
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
      created_at: user.created_at || new Date().toISOString()
    };
    
    try {
      // Fire-and-forget upsert to try and heal the database state
      authService.upsertProfile(fallback).catch(e => console.warn("Background profile heal failed:", e));
      return fallback;
    } catch (e) {
      return fallback;
    }
  }
};
