
import { supabase } from './client';
import { Listing, UserProfile, Order, OrderItem, OrderStatus } from '../../types/index';

export const db = {
  // --- USER PROFILE ---
  async getCurrentUser(signal?: AbortSignal): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) return null;
    return profile as UserProfile;
  },

  // --- MARKETPLACE LISTINGS ---
  async getListings(signal?: AbortSignal): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('listings')
      .select('*, profiles:seller_id(full_name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .abortSignal(signal);
    
    if (error) throw error;
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
      status: 'active',
      created_at: new Date().toISOString()
    });
    if (error) throw error;
  },

  // --- ORDERS & DASHBOARD ---
  async getSellerDashboardData(userId: string, signal?: AbortSignal) {
    const [listingsRes, ordersRes] = await Promise.all([
      supabase.from('listings')
        .select('*')
        .eq('seller_id', userId)
        .abortSignal(signal),
      supabase.from('orders')
        .select(`
          *,
          listings(title, image_url),
          buyer:profiles!orders_buyer_id_fkey(full_name)
        `)
        .eq('seller_id', userId)
        .order('created_at', { ascending: false })
        .abortSignal(signal)
    ]);

    if (listingsRes.error) throw listingsRes.error;
    if (ordersRes.error) throw ordersRes.error;

    return {
      listings: listingsRes.data || [],
      orders: (ordersRes.data || []).map(o => ({
        ...o,
        product_title: (o.listings as any)?.title,
        image_url: (o.listings as any)?.image_url,
        buyer_name: (o.buyer as any)?.full_name || 'Student'
      }))
    };
  },

  async createOrder(listing: Listing, amount: number, deliveryInfo: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase.from('orders').insert({
      buyer_id: user.id,
      seller_id: listing.seller_id,
      listing_id: listing.id,
      amount: amount,
      status: 'pending',
      delivery_info: deliveryInfo,
      created_at: new Date().toISOString()
    });

    if (error) throw error;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    if (error) throw error;
  },

  // --- MESSAGING FOUNDATION ---
  async getOrCreateConversation(listingId: string, sellerId: string, buyerId: string) {
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listingId)
      .eq('buyer_id', buyerId)
      .maybeSingle();

    if (existing) return existing.id;

    const { data: created, error } = await supabase
      .from('conversations')
      .insert({ listing_id: listingId, buyer_id: buyerId, seller_id: sellerId })
      .select('id')
      .single();

    if (error) throw error;
    return created.id;
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

  async uploadImage(file: File): Promise<string> {
    const path = `listings/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('market-assets').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('market-assets').getPublicUrl(path);
    return data.publicUrl;
  }
};
