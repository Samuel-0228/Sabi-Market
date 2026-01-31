
import { createClient } from '@supabase/supabase-js';
import { Listing, UserProfile, Order, Message, Conversation } from '../types';
import { COMMISSION_RATE } from '../constants';

const supabaseUrl = process.env.SUPABASE_URL || 'https://fqkrddoodkawtmcapvyu.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxa3JkZG9vZGthd3RtY2Fwdnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0OTQzMzIsImV4cCI6MjA4MzA3MDMzMn0.cFX3TVq697b_-9bj_bONzGZivE5JzowVKoSvBkZvttY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const db = {
  async getCurrentUser(): Promise<UserProfile | null> {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData || !authData.user) return null;

    const user = authData.user;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      const newProfile: UserProfile = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || 'Student',
        role: 'student',
        is_verified: user.email?.endsWith('@aau.edu.et') || false,
        created_at: user.created_at,
        preferences: []
      };

      try {
        await supabase.from('profiles').upsert(newProfile);
        return newProfile;
      } catch (e) {
        return newProfile;
      }
    }

    return profile;
  },

  async uploadImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `listings/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('market-assets')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('market-assets')
      .getPublicUrl(filePath);

    return data.publicUrl;
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
        data: { full_name: fullName }
      }
    });
    
    if (error) throw error;
    
    if (data?.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        email: email,
        full_name: fullName,
        preferences: preferences,
        is_verified: email.endsWith('@aau.edu.et'),
        role: 'student'
      });
      if (profileError) console.warn("Profile creation failed", profileError);
    }
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },

  async getListings(): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('listings')
      .select('*, profiles(full_name)')
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
      status: listing.stock === 0 ? 'sold_out' : 'active'
    });
    if (error) throw error;
  },

  async getOrCreateConversation(listingId: string, sellerId: string): Promise<string> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error("Unauthorized");
    const buyerId = userData.user.id;

    if (buyerId === sellerId) throw new Error("You cannot chat with yourself");

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listingId)
      .eq('buyer_id', buyerId)
      .single();

    if (existing) return existing.id;

    const { data: created, error } = await supabase
      .from('conversations')
      .insert({ listing_id: listingId, buyer_id: buyerId, seller_id: sellerId })
      .select('id')
      .single();

    if (error) throw error;
    return created.id;
  },

  async sendMessage(conversationId: string, content: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error("Unauthorized");

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: userData.user.id,
      content
    });
    if (error) throw error;
  },

  async getOrders(role: 'buyer' | 'seller'): Promise<Order[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error("Unauthorized");

    const { data, error } = await supabase
      .from('orders')
      .select('*, listings(title)')
      .eq(role === 'buyer' ? 'buyer_id' : 'seller_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(o => ({
      ...o,
      listing_title: (o as any).listings?.title || 'Unknown Item'
    }));
  },

  async createOrder(listing: Listing, amount: number, deliveryInfo: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error("Unauthorized");

    const commission = amount * COMMISSION_RATE;
    
    // 1. Create order
    const { error: orderError } = await supabase.from('orders').insert({
      buyer_id: userData.user.id,
      seller_id: listing.seller_id,
      listing_id: listing.id,
      amount: amount,
      commission: commission,
      status: 'pending',
      delivery_info: deliveryInfo
    });
    if (orderError) throw orderError;

    // 2. Decrement stock
    const newStock = Math.max(0, listing.stock - 1);
    const { error: updateError } = await supabase
      .from('listings')
      .update({ 
        stock: newStock,
        status: newStock <= 0 ? 'sold_out' : 'active'
      })
      .eq('id', listing.id);
    if (updateError) throw updateError;
  }
};
