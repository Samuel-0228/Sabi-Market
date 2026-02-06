
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
    const { lastFetched, items } = get();
    const now = Date.now();
    
    if (items.length > 0 && !force && lastFetched && (now - lastFetched < 10000)) {
      return; 
    }

    set({ loading: true });

    try {
      // Using explicit joins to avoid issues with multiple relationships to profiles
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
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
        lastFetched: now
      });
    } catch (e) {
      console.error("Orders store fetch failed:", e);
    } finally {
      // IMPORTANT: Always set loading to false to prevent UI hang
      set({ loading: false });
    }
  },
  clear: () => set({ items: [], loading: false, lastFetched: null })
}));
