
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

    // We don't manually upsert here to avoid race conditions with the SQL trigger.
    // Instead, syncProfile will handle the wait/retry.
    
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
      useOrdersStore.getState().clear();
      useChatStore.getState().clear();
      useFeedStore.getState().fetch();
      await authService.signOut();
    } catch (e) {
      console.error("Logout failed", e);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
    }
  },

  async syncProfile(): Promise<UserProfile | null> {
    const { data: { user }, error: authError } = await authService.getUser();
    if (authError || !user) return null;

    // Retry logic to wait for the Postgres trigger to create the profile
    let profile = null;
    let attempts = 0;
    while (!profile && attempts < 5) {
      const { data } = await authService.getProfile(user.id);
      if (data) {
        profile = data;
        break;
      }
      await new Promise(r => setTimeout(r, 500));
      attempts++;
    }
    
    if (!profile) {
      // Emergency recovery if trigger fails
      const recoveryProfile: UserProfile = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || 'Savvy Student',
        role: 'student',
        is_verified: user.email?.endsWith('@aau.edu.et') || false,
        preferences: user.user_metadata?.preferences || [],
        created_at: user.created_at
      };
      await authService.upsertProfile(recoveryProfile);
      return recoveryProfile;
    }
    
    return profile as UserProfile;
  }
};
