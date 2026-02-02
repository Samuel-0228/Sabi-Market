
import { supabase } from './client';
import { Listing, UserProfile, Order, Message, Conversation } from '../../types/index.d';
import { COMMISSION_RATE } from '../../config/constants';

const handleSupabaseError = (err: any, tableName: string) => {
  console.error(`Error in table ${tableName}:`, err);
  if (err.message?.includes('does not exist') || err.code === 'PGRST204' || err.message?.includes('schema cache')) {
    throw new Error(`Connection issue with ${tableName}. Please verify your database schema.`);
  }
  throw err;
};

export const db = {
  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData || !authData.user) return null;

      const user = authData.user;
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error fetching profile:", profileError);
      }

      if (!profile) {
        const newProfile: UserProfile = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || 'Savvy Student',
          role: 'student',
          is_verified: user.email?.endsWith('@aau.edu.et') || false,
          created_at: user.created_at,
          preferences: user.user_metadata?.preferences || []
        };
        
        const { error: insertError } = await supabase.from('profiles').upsert(newProfile);
        if (insertError) {
          console.error("Critical: Could not auto-create profile:", insertError);
          return newProfile;
        }
        return newProfile;
      }

      return profile;
    } catch (err) {
      console.error("Auth initialization failed:", err);
      return null;
    }
  },

  async uploadImage(file: File): Promise<string> {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) throw new Error("You must be logged in to upload photos.");

    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    const filePath = `listings/${timestamp}_${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('market-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("Supabase Storage Error:", uploadError);
      throw new Error(uploadError.message || "Failed to upload image.");
    }

    const { data } = supabase.storage
      .from('market-assets')
      .getPublicUrl(filePath);

    if (!data?.publicUrl) throw new Error("Could not retrieve public URL.");
    return data.publicUrl;
  },

  async login(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  async register(email: string, password: string, fullName: string, preferences: string[]): Promise<void> {
    const { data, error: authError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { 
          full_name: fullName,
          preferences: preferences
        }
      }
    });
    
    if (authError) throw authError;
    
    if (data?.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        email: email,
        full_name: fullName,
        preferences: preferences,
        is_verified: email.endsWith('@aau.edu.et'),
        role: 'student',
        created_at: new Date().toISOString()
      });
      
      if (profileError) {
        console.warn("Initial profile upsert failed (likely RLS). Profile will be auto-created on first load.", profileError);
      }
    }
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },

  async getListings(): Promise<Listing[]> {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          profiles:seller_id (
            full_name
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) handleSupabaseError(error, 'listings');
      
      return (data || []).map(l => ({
        ...l,
        seller_name: (l as any).profiles?.full_name || 'Verified Seller'
      }));
    } catch (e) {
      console.error("Failed to fetch listings:", e);
      return [];
    }
  },

  async createListing(listing: Partial<Listing>): Promise<void> {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) throw new Error("Please log in to post a listing.");

    const { error } = await supabase.from('listings').insert({
      ...listing,
      seller_id: data.user.id,
      status: (listing.stock || 0) <= 0 ? 'sold_out' : 'active',
      created_at: new Date().toISOString()
    });
    if (error) handleSupabaseError(error, 'listings');
  },

  async getOrCreateConversation(listingId: string, sellerId: string): Promise<string> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error("Log in required.");
    const buyerId = userData.user.id;

    if (buyerId === sellerId) throw new Error("You are the seller of this item.");

    const { data: existing, error: findError } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listingId)
      .eq('buyer_id', buyerId)
      .maybeSingle();

    if (findError) handleSupabaseError(findError, 'conversations');
    if (existing) return existing.id;

    const { data: created, error: createError } = await supabase
      .from('conversations')
      .insert({ 
        listing_id: listingId, 
        buyer_id: buyerId, 
        seller_id: sellerId 
      })
      .select('id')
      .single();

    if (createError) handleSupabaseError(createError, 'conversations');
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
    if (error) handleSupabaseError(error, 'messages');
  },

  async getOrders(role: 'buyer' | 'seller'): Promise<Order[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error("Unauthorized");

    const { data, error } = await supabase
      .from('orders')
      .select('*, listings(title)')
      .eq(role === 'buyer' ? 'buyer_id' : 'seller_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) handleSupabaseError(error, 'orders');
    return (data || []).map(o => ({
      ...o,
      listing_title: (o as any).listings?.title || 'Campus Item'
    }));
  },

  async createOrder(listing: Listing, amount: number, deliveryInfo: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error("Unauthorized");

    const commission = amount * COMMISSION_RATE;
    
    const { error: orderError } = await supabase.from('orders').insert({
      buyer_id: userData.user.id,
      seller_id: listing.seller_id,
      listing_id: listing.id,
      amount: amount,
      commission: commission,
      status: 'pending',
      delivery_info: deliveryInfo,
      created_at: new Date().toISOString()
    });
    if (orderError) handleSupabaseError(orderError, 'orders');

    const newStock = Math.max(0, listing.stock - 1);
    const { error: updateError } = await supabase
      .from('listings')
      .update({ 
        stock: newStock,
        status: newStock <= 0 ? 'sold_out' : 'active'
      })
      .eq('id', listing.id);
    if (updateError) handleSupabaseError(updateError, 'listings');
  }
};
