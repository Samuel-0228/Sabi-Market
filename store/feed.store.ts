
import { create } from 'zustand';
import { Listing } from '../types';
import { coreClient } from '../services/supabase/coreClient';

interface FeedState {
  listings: Listing[];
  filteredListings: Listing[];
  loading: boolean;
  searchQuery: string;
  activeCategory: string;
  fetch: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setCategory: (category: string) => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  listings: [],
  filteredListings: [],
  loading: false,
  searchQuery: '',
  activeCategory: 'all',
  
  fetch: async () => {
    set({ loading: true });
    try {
      const { data, error } = await coreClient
        .from('listings')
        .select('*, profiles:seller_id(full_name)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      const fetchedListings = (data || []).map(l => ({
        ...l,
        seller_name: (l as any).profiles?.full_name || 'Verified Seller'
      }));
      
      set({ listings: fetchedListings, filteredListings: fetchedListings, loading: false });
    } catch (e) {
      console.error("Feed fetch failed", e);
      set({ loading: false });
    }
  },

  setSearchQuery: (query: string) => {
    const { listings, activeCategory } = get();
    const filtered = listings.filter(l => {
      const matchesSearch = l.title.toLowerCase().includes(query.toLowerCase()) || 
                           l.description.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = activeCategory === 'all' || l.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
    set({ searchQuery: query, filteredListings: filtered });
  },

  setCategory: (category: string) => {
    const { listings, searchQuery } = get();
    const filtered = listings.filter(l => {
      const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           l.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = category === 'all' || l.category === category;
      return matchesSearch && matchesCategory;
    });
    set({ activeCategory: category, filteredListings: filtered });
  }
}));
