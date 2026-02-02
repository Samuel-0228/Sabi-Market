
import { createClient } from '@supabase/supabase-js';
import { Listing, UserProfile, Order, Message, Conversation } from '../types';
import { COMMISSION_RATE } from '../constants';

const supabaseUrl = process.env.SUPABASE_URL || 'https://fqkrddoodkawtmcapvyu.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxa3JkZG9vZGthd3RtY2Fwdnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0OTQzMzIsImV4cCI6MjA4MzA3MDMzMn0.cFX3TVq697b_-9bj_bONzGZivE5JzowVKoSvBkZvttY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const handleSupabaseError = (err: any, context: string) => {
  console.error(`Supabase Error [${context}]:`, err);
  throw err;
};

export const db = {
  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return null;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        // Recovery: Profile doesn't exist in DB, create it from Auth metadata
        const recoveryProfile: UserProfile = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || 'Savvy Student',
          role: 'student',
          is_verified: user.email?.endsWith('@aau.edu.et') || false,
          created_at: user.created_at,
          preferences: user.user_metadata?.preferences || []
        };
        
        // Try to persist it now that we have a session
        const { error: insertError } = await supabase.from('profiles').upsert(recoveryProfile);
        if (insertError) console.warn("Could not persist recovery profile:", insertError);
        
        return recoveryProfile;
      }

      return profile;
    } catch (err) {
      console.error("Auth sync failed:", err);
      return null;
    }
  },

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async register(email: string, password: string, fullName: string, preferences: string[]) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, preferences },
        emailRedirectTo: window.location.origin
      }
    });

    if (error) throw error;

    // If 'Confirm Email' is OFF in Supabase, data.session will be present.
    if (data.user && data.session) {
      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        preferences,
        role: 'student',
        is_verified: email.endsWith('@aau.edu.et'),
        created_at: new Date().toISOString()
      });
      if (upsertError) console.warn("Deferred profile creation:", upsertError);
    }

    return {
      user: data.user,
      session: data.session,
      needsConfirmation: data.user && !data.session
    };
  },

  async logout() {
    await supabase.auth.signOut();
  },

  async getListings(): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('listings')
      .select('*, profiles:seller_id(full_name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) handleSupabaseError(error, 'getListings');
    return (data || []).map(l => ({
      ...l,
      seller_name: (l as any).profiles?.full_name || 'Verified Seller'
    }));
  },

  async createListing(listing: Partial<Listing>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase.from('listings').insert({
      ...listing,
      seller_id: user.id,
      created_at: new Date().toISOString()
    });
    if (error) handleSupabaseError(error, 'createListing');
  },

  async getOrders(role: 'buyer' | 'seller') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('orders')
      .select('*, listings(title)')
      .eq(role === 'buyer' ? 'buyer_id' : 'seller_id', user.id)
      .order('created_at', { ascending: false });

    if (error) handleSupabaseError(error, 'getOrders');
    return (data || []).map(o => ({
      ...o,
      listing_title: (o as any).listings?.title || 'Campus Item'
    }));
  },

  async createOrder(listing: Listing, amount: number, deliveryInfo: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase.from('orders').insert({
      buyer_id: user.id,
      seller_id: listing.seller_id,
      listing_id: listing.id,
      amount,
      commission: amount * COMMISSION_RATE,
      status: 'pending',
      delivery_info: deliveryInfo,
      created_at: new Date().toISOString()
    });
    if (error) handleSupabaseError(error, 'createOrder');
  },

  async sendMessage(conversationId: string, content: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString()
    });
    if (error) handleSupabaseError(error, 'sendMessage');
  },

  async uploadImage(file: File): Promise<string> {
    const timestamp = Date.now();
    const filePath = `listings/${timestamp}_${file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase()}`;
    const { error: uploadError } = await supabase.storage
      .from('market-assets')
      .upload(filePath, file);

    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('market-assets').getPublicUrl(filePath);
    return data.publicUrl;
  },

  async getOrCreateConversation(listingId: string, sellerId: string): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    
    const { data: existing, error: fetchError } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listingId)
      .eq('buyer_id', user.id)
      .maybeSingle();

    if (fetchError) handleSupabaseError(fetchError, 'getExistingConversation');
    if (existing) return (existing as any).id;

    const { data: created, error: createError } = await supabase
      .from('conversations')
      .insert({
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: sellerId,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (createError) handleSupabaseError(createError, 'createConversation');
    return (created as any).id;
  }
};
