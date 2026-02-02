
import { authService } from '../../services/supabase/auth';
import { UserProfile } from '../../types/index';

export const authApi = {
  async register(email, password, fullName, preferences) {
    // 1. Sign up the user
    const { data, error } = await authService.signUp(email, password, { 
      full_name: fullName, 
      preferences 
    });
    
    if (error) throw error;

    // 2. Immediately try to create the profile record.
    // We use upsert so if it already exists it just updates.
    // If 'Confirm Email' is OFF in Supabase, data.session will be present.
    if (data.user) {
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
      } catch (e) {
        console.warn("Profile table insert failed. Ensure RLS allows inserts for authenticated/anon during signup or disable email confirmation in Supabase.", e);
      }
    }
    
    return {
      user: data.user,
      session: data.session,
      // If session is null here, Supabase still has 'Confirm Email' enabled.
      needsConfirmation: data.user && !data.session
    };
  },

  async login(email, password) {
    const { data, error } = await authService.signIn(email, password);
    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await authService.signOut();
    if (error) {
      localStorage.removeItem('supabase.auth.token');
      window.location.reload();
    }
  },

  async syncProfile(): Promise<UserProfile | null> {
    const { data: { user }, error: authError } = await authService.getUser();
    if (authError || !user) return null;

    // Fetch profile from DB
    const { data: profile, error: profileError } = await authService.getProfile(user.id);
    
    // Recovery Logic: If Auth exists but Profile record is missing in the database table
    if (!profile) {
      const recoveryProfile: UserProfile = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || 'Savvy Student',
        role: 'student',
        is_verified: user.email?.endsWith('@aau.edu.et') || false,
        preferences: user.user_metadata?.preferences || [],
        created_at: user.created_at
      };
      
      // Attempt to save the recovery profile to the DB
      try {
        const { error: upsertError } = await authService.upsertProfile(recoveryProfile);
        if (upsertError) throw upsertError;
        return recoveryProfile;
      } catch (e) {
        console.error("Could not sync profile to DB:", e);
        // Still return the local object so the UI works
        return recoveryProfile;
      }
    }
    
    return profile as UserProfile;
  }
};
