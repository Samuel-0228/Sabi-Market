
import { supabase } from './client';
import { Listing, UserProfile } from '../../types/index';

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

  async getSellerOrderItems() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        listings!inner(title, image_url, seller_id),
        buyer:profiles!orders_buyer_id_fkey(full_name)
      `)
      .eq('listings.seller_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(order => ({
      ...order,
      product_title: (order.listings as any)?.title,
      image_url: (order.listings as any)?.image_url,
      buyer_name: (order.buyer as any)?.full_name || 'Anonymous Student'
    }));
  },

  async getBuyerOrderItems() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        listings(title, image_url, profiles:seller_id(full_name))
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(order => ({
      ...order,
      product_title: (order.listings as any)?.title,
      image_url: (order.listings as any)?.image_url,
      seller_name: (order.listings as any)?.profiles?.full_name || 'Verified Seller'
    }));
  },

  async updateOrderItemStatus(orderId: string, status: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    if (error) throw error;
  },

  async createOrder(listing: Listing, amount: number, deliveryInfo: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        listing_id: listing.id,
        amount: amount,
        status: 'pending',
        delivery_info: deliveryInfo,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
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

    if (existing) return (existing as any).id;

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
    return (newConv as any).id;
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
