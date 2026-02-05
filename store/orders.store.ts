
import { create } from 'https://esm.sh/zustand';
import { coreClient } from '../services/supabase/coreClient';

interface OrdersState {
  items: any[];
  loading: boolean;
  fetch: (userId: string) => Promise<void>;
}

export const useOrdersStore = create<OrdersState>((set) => ({
  items: [],
  loading: false,
  fetch: async (userId) => {
    set({ loading: true });
    try {
      const { data, error } = await coreClient
        .from('orders')
        .select(`
          *,
          listings(title, image_url, profiles:seller_id(full_name))
        `)
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ 
        items: (data || []).map(order => ({
          ...order,
          product_title: (order.listings as any)?.title,
          image_url: (order.listings as any)?.image_url,
          seller_name: (order.listings as any)?.profiles?.full_name || 'Verified Seller'
        })),
        loading: false 
      });
    } catch (e) {
      console.error("Orders fetch failed", e);
      set({ loading: false });
    }
  }
}));
