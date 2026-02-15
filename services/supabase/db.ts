import { supabase } from './client';
import { Listing, UserProfile, OrderStatus, Order, Message } from '../../types';

// Utility for resilient DB interactions
const withRetry = async <T>(fn: () => Promise<T>, retries = 3): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise(r => setTimeout(r, 1000));
    return withRetry(fn, retries - 1);
  }
};

export const db = {
  // --- PROFILES ---
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
      
    if (error) return null;
    return data as UserProfile;
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return db.getProfile(user.id);
  },

  // --- MARKETPLACE ---
  async getListings(signal?: AbortSignal): Promise<Listing[]> {
    const query = supabase
      .from('listings')
      .select('*, profiles:seller_id(full_name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (signal) query.abortSignal(signal);

    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).map((l: any) => ({
      ...l,
      seller_name: l.profiles?.full_name || 'AAU Student'
    }));
  },

  async createListing(listing: Partial<Listing>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Auth required");
    
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('listings')
        .insert({
          ...listing,
          seller_id: user.id,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    });
  },

  // --- CHAT SYSTEM ---
  async getOrCreateConversation(listingId: string, sellerId: string, buyerId: string): Promise<string> {
    try {
      // Logic for deterministic lookup
      const { data: existing, error: findError } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listingId)
        .eq('buyer_id', buyerId)
        .maybeSingle();

      if (existing) return existing.id;

      // Create new conversation if not found
      const { data: created, error: createError } = await supabase
        .from('conversations')
        .insert({ 
          listing_id: listingId, 
          buyer_id: buyerId, 
          seller_id: sellerId,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (createError) throw createError;
      return created.id;
    } catch (err) {
      console.error("Critical error in getOrCreateConversation:", err);
      throw err;
    }
  },

  async sendMessage(conversationId: string, content: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    
    const { data, error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString()
    }).select().single();

    if (error) throw error;
    return data;
  },

  async deleteConversation(conversationId: string) {
    // 1. Manually delete all messages associated with this conversation
    // to prevent foreign key constraint violations if Cascade Delete is not set in DB
    const { error: msgError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId);
    
    if (msgError) {
      console.warn("Error clearing messages during conversation deletion:", msgError);
    }

    // 2. Delete the conversation record itself
    const { error: convError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);
      
    if (convError) throw convError;
  },

  // --- ORDERS ---
  async getOrders(userId: string, role: 'buyer' | 'seller', signal?: AbortSignal): Promise<Order[]> {
    const query = supabase
      .from('orders')
      .select(`
        *,
        listing:listing_id(title, image_url),
        seller:profiles!orders_seller_id_fkey(full_name),
        buyer:profiles!orders_buyer_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false });

    if (signal) query.abortSignal(signal);

    const { data, error } = await (role === 'buyer' 
      ? query.eq('buyer_id', userId) 
      : query.eq('seller_id', userId));

    if (error) throw error;

    return (data || []).map((o: any) => ({
      ...o,
      product_title: o.listing?.title,
      image_url: o.listing?.image_url,
      seller_name: o.seller?.full_name,
      buyer_name: o.buyer?.full_name
    }));
  },

  async createOrder(listing: Listing, amount: number, deliveryInfo: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized access. Please login.");

    if (user.id === listing.seller_id) {
      throw new Error("You cannot purchase your own listing.");
    }

    const { data: order, error } = await supabase.from('orders').insert({
      buyer_id: user.id,
      seller_id: listing.seller_id,
      listing_id: listing.id,
      amount,
      status: 'pending',
      delivery_info: deliveryInfo,
      created_at: new Date().toISOString()
    }).select().single();

    if (error) throw error;

    try {
      const cid = await db.getOrCreateConversation(listing.id, listing.seller_id, user.id);
      await db.sendMessage(cid, `🔔 New Trade Request: "${listing.title}". Suggested Meeting: ${deliveryInfo}`);
    } catch (chatErr) {
      console.warn("Order created, chat notification delay:", chatErr);
    }

    return order;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    if (error) throw error;
  },

  async uploadImage(file: File): Promise<string> {
    const path = `listings/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const { error } = await supabase.storage.from('market-assets').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('market-assets').getPublicUrl(path);
    return data.publicUrl;
  }
};