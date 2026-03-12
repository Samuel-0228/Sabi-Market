
import { supabase } from './supabase/client';
// Re-export supabase so it can be used by components importing from this module
export { supabase };
import { Listing, UserProfile, Order, Message, Conversation } from '../types';

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
        const recoveryProfile: UserProfile = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || 'Savvy Student',
          role: 'student',
          is_verified: user.email?.endsWith('@aau.edu.et') || false,
          created_at: user.created_at
        };
        await supabase.from('profiles').upsert(recoveryProfile);
        return recoveryProfile;
      }
      return profile;
    } catch (err) {
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
      email, password, options: { data: { full_name: fullName, preferences } }
    });
    if (error) throw error;
    return data;
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
    return (data || []).map((l: any) => ({
      ...l,
      seller_name: l.profiles?.full_name || 'Verified Seller'
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

    if (error) handleSupabaseError(error, 'getBuyerOrderItems');
    return (data || []).map((order: any) => ({
      ...order,
      product_title: order.listings?.title,
      image_url: order.listings?.image_url,
      seller_name: order.listings?.profiles?.full_name || 'Verified Seller'
    }));
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
    if (error) handleSupabaseError(error, 'getSellerOrderItems');
    return (data || []).map((order: any) => ({
      ...order,
      product_title: order.listings?.title,
      image_url: order.listings?.image_url,
      buyer_name: order.buyer?.full_name || 'Anonymous Student',
    }));
  },

  async updateOrderItemStatus(orderId: string, status: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    if (error) handleSupabaseError(error, 'updateOrderItemStatus');

    // Notify buyer
    const { data: order } = await supabase
      .from('orders')
      .select('buyer_id, listings(title)')
      .eq('id', orderId)
      .single();

    if (order) {
      this.notifyUser(
        (order as any).buyer_id,
        'Order Update',
        `Your order for ${(order as any).listings?.title} is now ${status}.`,
        '/orders'
      );
    }
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

    if (error) handleSupabaseError(error, 'createOrder');

    // Notify seller
    this.notifyUser(
      listing.seller_id,
      'New Order!',
      `You have a new order for ${listing.title}.`,
      '/seller-dashboard'
    );
  },

  async sendMessage(conversationId: string, content: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Fetch conversation to find recipient
    const { data: conv } = await supabase
      .from('conversations')
      .select('buyer_id, seller_id, listings(title)')
      .eq('id', conversationId)
      .single();

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString()
    });

    if (error) handleSupabaseError(error, 'sendMessage');

    // Notify recipient
    if (conv) {
      const recipientId = user.id === (conv as any).buyer_id ? (conv as any).seller_id : (conv as any).buyer_id;
      const listingTitle = (conv as any).listings?.title || 'a listing';
      this.notifyUser(
        recipientId,
        'New Message',
        `New message regarding ${listingTitle}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        `/messages?id=${conversationId}`
      );
    }
  },

  async uploadImage(file: File): Promise<string> {
    const timestamp = Date.now();
    const filePath = `listings/${timestamp}_${file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase()}`;
    const { error: uploadError } = await supabase.storage.from('market-assets').upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('market-assets').getPublicUrl(filePath);
    return data.publicUrl;
  },

  async getOrCreateConversation(listingId: string, sellerId: string): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const { data: existing } = await supabase.from('conversations')
      .select('id')
      .eq('listing_id', listingId)
      .eq('buyer_id', user.id)
      .eq('seller_id', sellerId)
      .maybeSingle();
    if (existing) return (existing as any).id;
    const { data: created, error: createError } = await supabase.from('conversations').insert({
      listing_id: listingId, buyer_id: user.id, seller_id: sellerId, created_at: new Date().toISOString()
    }).select('id').single();
    if (createError) handleSupabaseError(createError, 'createConversation');
    return (created as any).id;
  },

  async notifyUser(userId: string, title: string, body: string, url: string) {
    try {
      const { data: subData } = await supabase
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', userId)
        .maybeSingle();

      if (subData?.subscription) {
        await fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: subData.subscription,
            title,
            body,
            url
          })
        });
      }
    } catch (err) {
      console.warn('Failed to send push notification:', err);
    }
  }
};
