
import { supabase } from './client';
import { Listing, UserProfile, OrderStatus, Order, Message } from '../../types';

export const db = {
  // --- PROFILES ---
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) return null;
    return data as UserProfile;
  },

  // Added getCurrentUser to match usage in App.tsx and fix property missing error
  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return null;
      return await this.getProfile(user.id);
    } catch (err) {
      return null;
    }
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
    
    return (data || []).map(l => ({
      ...l,
      seller_name: (l as any).profiles?.full_name || 'AAU Student'
    }));
  },

  async createListing(listing: Partial<Listing>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Auth required");
    
    const { error } = await supabase.from('listings').insert({
      ...listing,
      seller_id: user.id,
      status: 'active',
      created_at: new Date().toISOString()
    });
    if (error) throw error;
  },

  // --- CHAT SYSTEM ---
  async getOrCreateConversation(listingId: string, sellerId: string, buyerId: string) {
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listingId)
      .eq('buyer_id', buyerId)
      .maybeSingle();

    if (existing) return (existing as any).id;

    const { data: created, error } = await supabase
      .from('conversations')
      .insert({ 
        listing_id: listingId, 
        buyer_id: buyerId, 
        seller_id: sellerId,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) throw error;
    return (created as any).id;
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
    if (error) throw error;
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

    return (data || []).map(o => ({
      ...o,
      product_title: (o.listing as any)?.title || 'Market Item',
      image_url: (o.listing as any)?.image_url,
      seller_name: (o.seller as any)?.full_name,
      buyer_name: (o.buyer as any)?.full_name
    }));
  },

  async createOrder(listing: Listing, amount: number, deliveryInfo: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: order, error: orderError } = await supabase.from('orders').insert({
      buyer_id: user.id,
      seller_id: listing.seller_id,
      listing_id: listing.id,
      amount: amount,
      status: 'pending',
      delivery_info: deliveryInfo,
      created_at: new Date().toISOString()
    }).select().single();

    if (orderError) throw orderError;

    // Auto-send notification message
    try {
      const cid = await this.getOrCreateConversation(listing.id, listing.seller_id, user.id);
      await this.sendMessage(cid, `Hi! I just placed an order for "${listing.title}". Please confirm the trade! Meeting point: ${deliveryInfo}`);
    } catch (e) { console.warn("Chat notification failed", e); }

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
    const fileName = `${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase()}`;
    const filePath = `listings/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('market-assets')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data } = supabase.storage.from('market-assets').getPublicUrl(filePath);
    return data.publicUrl;
  }
};
