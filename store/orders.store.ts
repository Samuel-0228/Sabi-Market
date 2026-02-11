
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
    const state = get();
    const now = Date.now();

    // Prevent hammering the DB - 5s throttle
    if (state.loading && !force) return;
    
    // Cache check
    if (state.items.length > 0 && !force && state.lastFetched && (now - state.lastFetched < 5000)) {
      return; 
    }

    set({ loading: true });

    try {
      // Use the most direct selection to avoid complex join resolution issues
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          amount,
          status,
          delivery_info,
          created_at,
          listing:listing_id(
            title, 
            image_url, 
            seller:seller_id(full_name)
          )
        `)
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedData = (data || []).map((order: any) => ({
        ...order,
        product_title: order.listing?.title || 'Market Item',
        image_url: order.listing?.image_url,
        seller_name: order.listing?.seller?.full_name || 'Verified Student'
      }));

      set({ 
        items: formattedData,
        lastFetched: now,
        loading: false 
      });
    } catch (e) {
      console.error("Orders store fetch failed:", e);
      set({ loading: false });
    } finally {
      // Absolute safety: if the promise resolves but data didn't set, ensure loading is cleared
      setTimeout(() => set({ loading: false }), 200);
    }
  },
  
  clear: () => set({ items: [], loading: false, lastFetched: null })
}));
