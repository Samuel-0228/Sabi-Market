
import { supabase } from './client';
import { Listing, Order } from '../../types';

// Renamed from dbService to db to match component imports and added missing functionality
export const db = {
  async getListings() {
    const { data, error } = await supabase.from('listings').select('*, profiles:seller_id(full_name)').eq('status', 'active').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async createListing(listing: any) {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('listings').insert({
      ...listing,
      seller_id: user?.id,
      created_at: new Date().toISOString()
    });
    if (error) throw error;
  },
  async getOrders(role: 'buyer' | 'seller', userId?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const uid = userId || user?.id;
    const { data, error } = await supabase.from('orders').select('*, listings(title)').eq(role === 'buyer' ? 'buyer_id' : 'seller_id', uid).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async createOrder(listing: any, amount: number, deliveryInfo: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('orders').insert({
      buyer_id: user?.id,
      seller_id: listing.seller_id,
      listing_id: listing.id,
      amount,
      commission: amount * 0.05,
      status: 'pending',
      delivery_info: deliveryInfo,
      created_at: new Date().toISOString()
    });
    if (error) throw error;
  },
  async sendMessage(conversationId: string, content: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user?.id,
      content,
      created_at: new Date().toISOString()
    });
    if (error) throw error;
  },
  async uploadImage(file: File) {
    const timestamp = Date.now();
    const filePath = `listings/${timestamp}_${file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase()}`;
    const { error: uploadError } = await supabase.storage
      .from('market-assets')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('market-assets')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
};
