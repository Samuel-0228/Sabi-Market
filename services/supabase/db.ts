
import { supabase } from './client';
import { Listing, UserProfile, OrderStatus } from '../../types';

export const db = {
  // --- USER & AUTH ---
  async getCurrentUser(signal?: AbortSignal): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const query = supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id);

    if (signal) {
      query.abortSignal(signal);
    }

    const { data: profile, error } = await query.maybeSingle();

    if (error) return null;
    return profile as UserProfile;
  },

  // --- MARKETPLACE ---
  async getListings(signal?: AbortSignal): Promise<Listing[]> {
    const query = supabase
      .from('listings')
      .select('*, profiles:seller_id(full_name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (signal) {
      query.abortSignal(signal);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return (data || []).map(l => ({
      ...l,
      seller_name: (l as any).profiles?.full_name || 'AAU Student'
    }));
  },

  async createListing(listing: Partial<Listing>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required");
    
    const { error } = await supabase.from('listings').insert({
      ...listing,
      seller_id: user.id,
      status: 'active',
      created_at: new Date().toISOString()
    });
    if (error) throw error;
  },

  // --- ORDERS & TRADES ---
  async getOrders(userId: string, role: 'buyer' | 'seller', signal?: AbortSignal) {
    const query = supabase
      .from('orders')
      .select(`
        *,
        listing:listing_id(title, image_url),
        seller:profiles!orders_seller_id_fkey(full_name),
        buyer:profiles!orders_buyer_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false });

    if (signal) {
      query.abortSignal(signal);
    }

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

    try {
      const convId = await this.getOrCreateConversation(listing.id, listing.seller_id, user.id);
      await this.sendMessage(convId, `🚀 NEW ORDER PLACED!\n\nItem: ${listing.title}\nPrice: ${amount} ETB\nMeeting Info: ${deliveryInfo}\n\nPlease check your Dashboard to accept this trade!`);
    } catch (msgErr) {
      console.warn("Order notification failed", msgErr);
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

  async uploadImage(file: File): Promise<string> {
    const ext = file.name.split('.').pop() || 'png';
    const cleanName = file.name.split('.')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${Date.now()}_${cleanName}.${ext}`;
    const filePath = `listings/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('market-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("Supabase Storage Error:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from('market-assets').getPublicUrl(filePath);
    if (!data?.publicUrl) throw new Error("Could not retrieve public URL for uploaded image.");
    
    return data.publicUrl;
  }
};
