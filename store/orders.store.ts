
import { create } from 'https://esm.sh/zustand';
import { coreClient } from '../services/supabase/coreClient';

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
    const { lastFetched, items } = get();
    const now = Date.now();
    
    // If we have data and it's fresh (last 30 seconds), don't show loading spinner
    if (items.length > 0 && !force && lastFetched && (now - lastFetched < 30000)) {
      return; 
    }

    // Only show full-screen loading if we have no data at all
    if (items.length === 0) set({ loading: true });

    try {
      const { data, error } = await coreClient
        .from('orders')
        .select(`
          *,
          listings(
            title, 
            image_url, 
            profiles:seller_id(full_name)
          )
        `)
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      set({ 
        items: (data || []).map(order => ({
          ...order,
          product_title: (order.listings as any)?.title || 'Unknown Product',
          image_url: (order.listings as any)?.image_url,
          seller_name: (order.listings as any)?.profiles?.full_name || 'Verified Seller'
        })),
        loading: false,
        lastFetched: now
      });
    } catch (e) {
      console.error("Orders store fetch failed:", e);
      set({ loading: false });
    }
  },
  clear: () => set({ items: [], loading: false, lastFetched: null })
}));
