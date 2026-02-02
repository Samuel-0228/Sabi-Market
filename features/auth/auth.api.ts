
import { authService } from '../../services/supabase/auth';
import { UserProfile } from '../../types/index';

export const authApi = {
  async register(email, password, fullName, preferences) {
    const { data, error } = await authService.signUp(email, password, { 
      full_name: fullName, 
      preferences 
    });
    
    if (error) throw error;

    // If sign up is successful, we try to create a profile.
    // NOTE: If Supabase requires email verification, data.session might be null.
    // In that case, we won't have the permissions to write to the 'profiles' table via RLS yet.
    // That's why syncProfile uses Auth metadata as a backup.
    if (data.user && data.session) {
      try {
        await authService.upsertProfile({
          id: data.user.id,
          email,
          full_name: fullName,
          preferences,
          role: 'student',
          is_verified: email.endsWith('@aau.edu.et'),
          created_at: new Date().toISOString()
        });
      } catch (e) {
        console.warn("Background profile creation deferred (requires verified session).", e);
      }
    }
    
    return {
      user: data.user,
      session: data.session,
      // If session is null, it means verification is required
      needsConfirmation: data.user && !data.session
    };
  },

  async login(email, password) {
    const { data, error } = await authService.signIn(email, password);
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
      }
      throw error;
    }
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
      
      // Attempt to save the recovery profile to the DB if we have a session
      try {
        await authService.upsertProfile(recoveryProfile);
      } catch (e) {
        // This might fail if the user is unverified or RLS is blocking
        console.debug("Could not persist profile yet, using metadata fallback.");
      }
      return recoveryProfile;
    }
    
    return profile as UserProfile;
  }
};
