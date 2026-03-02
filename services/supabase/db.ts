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

  async incrementVisitCount(userId: string): Promise<void> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('visit_count, last_active_date')
      .eq('id', userId)
      .maybeSingle();

    const currentVisits = profile?.visit_count || 0;
    const today = new Date().toISOString().split('T')[0];

    const updates: any = { 
      visit_count: currentVisits + 1,
      last_active_date: today
    };

    await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
      
    await db.grantPoints(userId, 10);
  },

  async grantPoints(userId: string, amount: number): Promise<void> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('points, level')
      .eq('id', userId)
      .maybeSingle();

    const currentPoints = profile?.points || 0;
    const newPoints = currentPoints + amount;
    
    // Level thresholds: 1: 0-99, 2: 100-249, 3: 250-499, 4: 500-999, 5: 1000+
    let newLevel = 1;
    if (newPoints >= 1000) newLevel = 5;
    else if (newPoints >= 500) newLevel = 4;
    else if (newPoints >= 250) newLevel = 3;
    else if (newPoints >= 100) newLevel = 2;

    await supabase
      .from('profiles')
      .update({ 
        points: newPoints,
        level: newLevel
      })
      .eq('id', userId);
  },

  async dailyClaim(userId: string): Promise<{ success: boolean; reward: number; streak: number; message: string }> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('points, last_claim_at, login_streak')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) return { success: false, reward: 0, streak: 0, message: "Profile not found" };

    const now = new Date();
    const lastClaim = profile.last_claim_at ? new Date(profile.last_claim_at) : null;

    if (lastClaim) {
      const diffMs = now.getTime() - lastClaim.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours < 24) {
        const remainingHours = Math.ceil(24 - diffHours);
        return { success: false, reward: 0, streak: profile.login_streak || 0, message: `Wait ${remainingHours} more hours` };
      }
    }

    let streak = profile.login_streak || 0;
    const isConsecutive = lastClaim && (now.getTime() - lastClaim.getTime()) < (48 * 60 * 60 * 1000);
    
    if (isConsecutive) {
      streak += 1;
    } else {
      streak = 1;
    }

    let reward = 5; // Base reward
    if (streak === 7) reward += 10;
    if (streak === 30) reward += 50;

    await supabase
      .from('profiles')
      .update({
        last_claim_at: now.toISOString(),
        login_streak: streak
      })
      .eq('id', userId);

    await db.grantPoints(userId, reward);
    
    // Check milestones
    if (streak === 7) await db.awardAchievement(userId, 'streak_7');
    if (streak === 30) await db.awardAchievement(userId, 'streak_30');

    return { success: true, reward, streak, message: "Claimed successfully!" };
  },

  async getLeaderboard(limit = 20) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, level, points, avatar_url')
      .order('points', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  async awardAchievement(userId: string, achievementId: string) {
    // Check if already earned
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .maybeSingle();

    if (existing) return;

    // Fetch achievement reward
    const { data: achievement } = await supabase
      .from('achievements')
      .select('xp_reward')
      .eq('id', achievementId)
      .maybeSingle();

    const reward = achievement?.xp_reward || 0;

    await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_id: achievementId,
        earned_at: new Date().toISOString()
      });

    if (reward > 0) {
      await db.grantPoints(userId, reward);
    }
  },

  async getUserAchievements(userId: string) {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*, achievement:achievements(*)')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  },

  async applyReferral(userId: string, referralCode: string): Promise<{ success: boolean; message: string }> {
    // Check if user already referred
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('referred_by')
      .eq('id', userId)
      .single();

    if (userProfile?.referred_by) return { success: false, message: "Already referred" };

    // Find referrer
    const { data: referrer } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', referralCode)
      .maybeSingle();

    if (!referrer) return { success: false, message: "Invalid referral code" };
    if (referrer.id === userId) return { success: false, message: "Cannot refer yourself" };

    // Update user
    await supabase
      .from('profiles')
      .update({ referred_by: referrer.id })
      .eq('id', userId);

    // Reward both
    await db.grantPoints(userId, 20);
    await db.grantPoints(referrer.id, 50);
    
    await db.awardAchievement(referrer.id, 'first_referral');

    return { success: true, message: "Referral applied!" };
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return db.getProfile(user.id);
  },

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async register(email: string, password: string, fullName: string, preferences: string[]) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          preferences
        }
      }
    });
    if (error) throw error;
    
    // Ensure profile exists
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: email,
        full_name: fullName,
        preferences: preferences,
        role: 'student',
        created_at: new Date().toISOString()
      });
    }
    
    return data;
  },

  async logout() {
    await supabase.auth.signOut();
  },

  // --- MARKETPLACE ---
  async getListings(signal?: AbortSignal, sortBy: 'newest' | 'price_asc' | 'price_desc' = 'newest'): Promise<Listing[]> {
    const query = supabase
      .from('listings')
      .select('*, profiles:seller_id(full_name)')
      .eq('status', 'active')
      .eq('is_deleted', false);

    if (sortBy === 'newest') {
      query.order('created_at', { ascending: false });
    } else if (sortBy === 'price_asc') {
      query.order('price', { ascending: true });
    } else if (sortBy === 'price_desc') {
      query.order('price', { ascending: false });
    }

    if (signal) query.abortSignal(signal);

    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).map((l: any) => ({
      ...l,
      seller_name: l.profiles?.full_name || 'AAU Student'
    }));
  },

  async getUserListings(userId: string, signal?: AbortSignal): Promise<Listing[]> {
    const query = supabase
      .from('listings')
      .select('*, profiles:seller_id(full_name)')
      .eq('seller_id', userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (signal) query.abortSignal(signal);

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((l: any) => ({
      ...l,
      seller_name: l.profiles?.full_name || 'AAU Student'
    }));
  },

  async deleteListing(listingId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Auth required");

    // Check if listing belongs to user
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('seller_id')
      .eq('id', listingId)
      .single();

    if (fetchError || !listing) throw new Error("Listing not found");
    if (listing.seller_id !== user.id) throw new Error("Unauthorized");

    // Check for active orders
    const { data: activeOrders, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('listing_id', listingId)
      .not('status', 'in', '("completed","cancelled","disputed")');

    if (orderError) throw orderError;
    if (activeOrders && activeOrders.length > 0) {
      throw new Error("Cannot delete listing with active trade requests.");
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('listings')
      .update({ 
        is_deleted: true, 
        deleted_at: new Date().toISOString(),
        status: 'archived'
      })
      .eq('id', listingId);

    if (deleteError) throw deleteError;
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
      
      // Grant points for listing
      await db.grantPoints(user.id, 50);
      
      return data;
    });
  },

  // --- CHAT SYSTEM ---
  async getOrCreateConversation(listingId: string, sellerId: string, buyerId: string): Promise<string> {
    try {
      const { data: existing, error: findError } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listingId)
        .eq('buyer_id', buyerId)
        .eq('seller_id', sellerId)
        .maybeSingle();

      if (existing) return existing.id;

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

  async sendMessage(conversation_id: string, content: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    
    const { data, error } = await supabase.from('messages').insert({
      conversation_id,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString()
    }).select().single();

    if (error) throw error;
    return data;
  },

  /**
   * Permanently removes the conversation from the database.
   * Requires 'ON DELETE CASCADE' on the 'messages' table fkey for 'conversation_id'
   * to ensure all associated messages are wiped automatically.
   */
  async deleteConversation(conversationId: string) {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);
      
    if (error) {
      console.error("Database deletion failed:", error);
      throw new Error("Could not delete conversation. Please try again.");
    }
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
      status: 'not_seen',
      delivery_info: deliveryInfo,
      created_at: new Date().toISOString()
    }).select().single();

    if (error) throw error;

    // Grant points for placing an order
    await db.grantPoints(user.id, 100);
    
    // Award purchase achievements
    await db.awardAchievement(user.id, 'first_purchase');
    
    // Check for 10 purchases
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('buyer_id', user.id);
      
    if (count && count >= 10) {
      await db.awardAchievement(user.id, 'purchases_10');
    }

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
  },

  // --- CART SYSTEM ---
  async getCartItems(userId: string) {
    const { data, error } = await supabase
      .from('cart_items')
      .select('*, listing:listings(*, profiles:seller_id(full_name))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      listing: {
        ...item.listing,
        seller_name: item.listing?.profiles?.full_name || 'AAU Student'
      }
    }));
  },

  async addToCart(userId: string, productId: string, quantity = 1) {
    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id);
      if (error) throw error;
      return existing.id;
    } else {
      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          user_id: userId,
          product_id: productId,
          quantity,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();
      if (error) throw error;
      return data.id;
    }
  },

  async removeFromCart(itemId: string) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);
    if (error) throw error;
  },

  async updateCartQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) return db.removeFromCart(itemId);
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId);
    if (error) throw error;
  },

  async clearCart(userId: string) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
  }
};