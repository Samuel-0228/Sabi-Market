
import { create } from 'https://esm.sh/zustand';
import { Listing } from '../types';
import { coreClient } from '../services/supabase/coreClient';

interface FeedState {
  listings: Listing[];
  loading: boolean;
  fetch: () => Promise<void>;
}

export const useFeedStore = create<FeedState>((set) => ({
  listings: [],
  loading: false,
  fetch: async () => {
    set({ loading: true });
    try {
      const { data, error } = await coreClient
        .from('listings')
        .select('*, profiles:seller_id(full_name)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      set({ 
        listings: (data || []).map(l => ({
          ...l,
          seller_name: (l as any).profiles?.full_name || 'Verified Seller'
        })),
        loading: false 
      });
    } catch (e) {
      console.error("Feed fetch failed", e);
      set({ loading: false });
    }
  }
}));
