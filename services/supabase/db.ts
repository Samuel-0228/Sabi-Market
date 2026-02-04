
import { supabase } from './client';
import { Listing, Order, UserProfile } from '../../types/index';

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

  async getOrders(role: 'buyer' | 'seller') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('orders')
      .select('*, listings(title)')
      .eq(role === 'buyer' ? 'buyer_id' : 'seller_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(o => ({
      ...o,
      listing_title: (o as any).listings?.title || 'Campus Item'
    }));
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
  },

  async createOrder(listing: any, amount: number, deliveryInfo: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const { error } = await supabase.from('orders').insert({
      buyer_id: user.id,
      seller_id: listing.seller_id,
      listing_id: listing.id,
      amount,
      commission: amount * 0.05,
      status: 'pending',
      delivery_info: deliveryInfo
    });
    if (error) throw error;
  }
};
