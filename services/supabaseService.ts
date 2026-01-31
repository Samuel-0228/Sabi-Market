
import { createClient } from '@supabase/supabase-js';
import { Listing, UserProfile, Order } from '../types';

// These variables are assumed to be provided by the environment
const supabaseUrl = process.env.SUPABASE_URL || 'supabase-url';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const db = {
  async getCurrentUser(): Promise<UserProfile | null> {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data || !data.user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return profile;
  },

  async login(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  async register(email: string, password: string, fullName: string, preferences: string[]): Promise<void> {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { full_name: fullName, preferences }
      }
    });
    if (error) throw error;
    
    // Note: In Supabase, verification emails are sent automatically if enabled.
    // The profile will be created/updated upon verification via triggers or manually here if needed.
    if (data?.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: email,
        full_name: fullName,
        preferences: preferences,
        is_verified: email.endsWith('@aau.edu.et'),
        role: 'student'
      });
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
      seller_name: l.profiles?.full_name
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
      listing_title: o.listings?.title
    }));
  }
};
