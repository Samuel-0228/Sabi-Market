
import { authService } from '../../services/supabase/auth';
import { UserProfile } from '../../types';

export const authApi = {
  async register(email, password, fullName, preferences) {
    const { data, error } = await authService.signUp(email, password, { 
      full_name: fullName, 
      preferences 
    });
    if (error) throw error;

    if (data.user) {
      // Attempt to create the DB profile immediately. 
      // If RLS fails because session is not yet active, getProfile in App.tsx will fix it.
      await authService.upsertProfile({
        id: data.user.id,
        email,
        full_name: fullName,
        preferences,
        role: 'student',
        is_verified: email.endsWith('@aau.edu.et'),
        created_at: new Date().toISOString()
      }).catch(e => console.warn("Background profile creation failed:", e));
    }
    return data;
  },

  async login(email, password) {
    const { data, error } = await authService.signIn(email, password);
    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await authService.signOut();
    if (error) throw error;
  },

  async syncProfile(): Promise<UserProfile | null> {
    const { data: { user }, error: authError } = await authService.getUser();
    if (authError || !user) return null;

    const { data: profile, error: profileError } = await authService.getProfile(user.id);
    
    // Recovery logic: If Auth exists but Profile doesn't (due to timing)
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
      // Try to save the recovery profile
      await authService.upsertProfile(recoveryProfile).catch(console.error);
      return recoveryProfile;
    }
    return profile;
  }
};
