
import { authService } from '../../services/supabase/auth';
import { UserProfile } from '../../types/index';
import { useOrdersStore } from '../../store/orders.store';
import { useChatStore } from '../../messaging/chat.store';
import { useFeedStore } from '../../store/feed.store';

export const authApi = {
  async register(email: string, password: string, fullName: string, preferences: string[]) {
    const { data, error } = await authService.signUp(email, password, { 
      full_name: fullName, 
      preferences 
    });
    
    if (error) throw error;

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
        console.warn("Profile sync skipped or failed during signup.", e);
      }
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
    return data;
  },

  async logout() {
    try {
      // Clear all state stores
      useOrdersStore.getState().clear();
      useChatStore.getState().clear();
      useFeedStore.getState().fetch(); // Refresh feed on next load

      const { error } = await authService.signOut();
      if (error) throw error;
    } catch (e) {
      console.error("Logout failed, clearing local storage as fallback", e);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
    }
  },

  async syncProfile(): Promise<UserProfile | null> {
    const { data: { user }, error: authError } = await authService.getUser();
    if (authError || !user) return null;

    const { data: profile } = await authService.getProfile(user.id);
    
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
      
      try {
        await authService.upsertProfile(recoveryProfile);
        return recoveryProfile;
      } catch (e) {
        return recoveryProfile;
      }
    }
    
    return profile as UserProfile;
  }
};
