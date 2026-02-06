
import { create } from 'zustand';
import { supabase } from '../services/supabase/client';

interface OrdersState {
  items: any[];
  loading: boolean;
  lastFetched: number | null;
  fetch: (userId: string, force?: boolean) => Promise<void>;
  clear: () => void;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  items: [],
  loading: false,
  lastFetched: null,
  fetch: async (userId, force = false) => {
    const { lastFetched, items, loading: currentLoading } = get();
    
    // Prevent double-fetching if already loading
    if (currentLoading) return;

    const now = Date.now();
    // Cache for 15 seconds to avoid repeated hammering of the DB
    if (items.length > 0 && !force && lastFetched && (now - lastFetched < 15000)) {
      return; 
    }

    set({ loading: true });

    try {
      // Simplified query to ensure maximum speed
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          amount,
          status,
          delivery_info,
          created_at,
          listing:listings(
            title, 
            image_url, 
            seller:profiles!listings_seller_id_fkey(full_name)
          )
        `)
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedData = (data || []).map(order => ({
        ...order,
        product_title: (order.listing as any)?.title || 'Market Product',
        image_url: (order.listing as any)?.image_url,
        seller_name: (order.listing as any)?.seller?.full_name || 'Verified Seller'
      }));

      set({ 
        items: formattedData,
        lastFetched: now,
        loading: false // Reset here on success
      });
    } catch (e) {
      console.error("Orders store fetch failed:", e);
      // Ensure we don't leave the user stuck in a spinner on failure
      set({ loading: false });
    } finally {
      // Safety net for edge case promise resolutions
      setTimeout(() => set({ loading: false }), 500);
    }
  },
  clear: () => set({ items: [], loading: false, lastFetched: null })
}));
