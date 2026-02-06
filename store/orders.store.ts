
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

    // Cache logic: Only skip if not forced and data is fresh (within 10s)
    if (state.items.length > 0 && !force && state.lastFetched && (now - state.lastFetched < 10000)) {
      return; 
    }

    // Set loading immediately
    set({ loading: true });

    try {
      // Optimized Query: Using standard relationship hints for faster execution
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          amount,
          status,
          delivery_info,
          created_at,
          listings(
            title, 
            image_url, 
            profiles:seller_id(full_name)
          )
        `)
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedData = (data || []).map(order => ({
        ...order,
        product_title: (order.listings as any)?.title || 'Market Product',
        image_url: (order.listings as any)?.image_url,
        seller_name: (order.listings as any)?.profiles?.full_name || 'Verified Seller'
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
      // Immediate reset, no artificial timeouts
      set({ loading: false });
    }
  },
  
  clear: () => set({ items: [], loading: false, lastFetched: null })
}));
