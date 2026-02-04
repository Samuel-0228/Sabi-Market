
import { supabase } from './client';
import { Listing, Order, UserProfile, OrderItem } from '../../types/index';

export const db = {
  async getCurrentUser(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) return null;
    return profile;
  },

  async getListings() {
    const { data, error } = await supabase
      .from('listings')
      .select('*, profiles:seller_id(full_name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
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
      created_at: new Date().toISOString()
    });
    if (error) throw error;
  },

  // Optimized for Seller Dashboard: Only fetch items belonging to this seller
  async getSellerOrderItems(): Promise<OrderItem[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('order_items')
      .select(`
        *,
        order:orders(delivery_info, buyer:profiles!orders_buyer_id_fkey(full_name))
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(item => ({
      ...item,
      buyer_name: (item.order as any)?.buyer?.full_name || 'Anonymous Student',
      delivery_info: (item.order as any)?.delivery_info
    }));
  },

  // Optimized for Buyer View: Fetch items the user has ordered
  async getBuyerOrderItems(): Promise<OrderItem[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('order_items')
      .select(`
        *,
        listings(image_url),
        seller:profiles!order_items_seller_id_fkey(full_name),
        order:orders!inner(buyer_id, delivery_info)
      `)
      .eq('order.buyer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(item => ({
      ...item,
      seller_name: (item.seller as any)?.full_name || 'Verified Seller',
      image_url: (item.listings as any)?.image_url,
      delivery_info: (item.order as any)?.delivery_info
    }));
  },

  async updateOrderItemStatus(itemId: string, status: string) {
    const { error } = await supabase
      .from('order_items')
      .update({ status })
      .eq('id', itemId);
    if (error) throw error;
  },

  async createOrder(listing: Listing, amount: number, deliveryInfo: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // 1. Create the Master Order record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        total_amount: amount,
        status: 'pending',
        delivery_info: deliveryInfo
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Create the Order Item snapshot (multi-vendor ready)
    const { error: itemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        seller_id: listing.seller_id,
        product_id: listing.id,
        product_title: listing.title,
        price: amount,
        quantity: 1,
        status: 'pending'
      });

    if (itemError) throw itemError;
  },

  async getOrCreateConversation(listingId: string, sellerId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listingId)
      .eq('buyer_id', user.id)
      .maybeSingle();

    if (existing) return existing.id;

    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: sellerId
      })
      .select('id')
      .single();

    if (error) throw error;
    return newConv.id;
  },

  async sendMessage(conversationId: string, content: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content
    }).select().single();

    if (error) throw error;
    return data;
  },

  async uploadImage(file: File) {
    const filePath = `listings/${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, '_')}`;
    const { error } = await supabase.storage.from('market-assets').upload(filePath, file);
    if (error) throw error;
    const { data } = supabase.storage.from('market-assets').getPublicUrl(filePath);
    return data.publicUrl;
  }
};
