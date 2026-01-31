
import { createClient } from '@supabase/supabase-js';
import { Listing, UserProfile, Order } from '../types';

const supabaseUrl = process.env.SUPABASE_URL || 'https://fqkrddoodkawtmcapvyu.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxa3JkZG9vZGthd3RtY2Fwdnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0OTQzMzIsImV4cCI6MjA4MzA3MDMzMn0.cFX3TVq697b_-9bj_bONzGZivE5JzowVKoSvBkZvttY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const db = {
  async getCurrentUser(): Promise<UserProfile | null> {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data || !data.user) return null;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      // If user exists in Auth but not in Profiles table yet, provide a temporary profile object
      // This is common if the user hasn't verified their email and RLS prevented insertion
      const minimalProfile: UserProfile = {
        id: data.user.id,
        email: data.user.email || '',
        full_name: data.user.user_metadata?.full_name || 'Student',
        role: 'student',
        is_verified: data.user.email?.endsWith('@aau.edu.et') || false,
        created_at: data.user.created_at
      };
      
      // Attempt to fix the missing profile if user session is already active
      try {
        await supabase.from('profiles').upsert(minimalProfile);
        return minimalProfile;
      } catch (e) {
        return minimalProfile;
      }
    }

    return profile;
  },

  async login(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("Login error:", error.message);
      throw error;
    }
  },

  async register(email: string, password: string, fullName: string, preferences: string[]): Promise<void> {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { full_name: fullName, preferences },
        emailRedirectTo: window.location.origin
      }
    });
    
    if (error) {
      console.error("Signup error:", error.message);
      throw error;
    }
    
    // Attempt profile creation. This might fail if the user is unauthenticated and email verification is ON
    if (data?.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        email: email,
        full_name: fullName,
        preferences: preferences,
        is_verified: email.endsWith('@aau.edu.et'),
        role: 'student'
      });
      if (profileError) console.warn("Profile creation deferred until verification:", profileError.message);
    }
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },

  async getListings(): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('listings')
      .select('*, profiles(full_name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(l => ({
      ...l,
      seller_name: (l as any).profiles?.full_name || 'Student'
    }));
  },

  async createListing(listing: Partial<Listing>): Promise<void> {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) throw new Error("Unauthorized");

    const { error } = await supabase.from('listings').insert({
      ...listing,
      seller_id: data.user.id,
      status: 'active'
    });
    if (error) throw error;
  },

  async getOrders(role: 'buyer' | 'seller'): Promise<Order[]> {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return [];

    const query = supabase.from('orders').select('*, listings(title)');
    if (role === 'buyer') query.eq('buyer_id', authData.user.id);
    else query.eq('seller_id', authData.user.id);

    const { data, error } = await query;
    if (error) throw error;
    
    return data.map(o => ({
      ...o,
      listing_title: (o as any).listings?.title
    }));
  }
};
