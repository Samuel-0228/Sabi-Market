
import { create } from 'zustand';
import { Listing } from '../types/index';
import { db } from '../services/supabase/db';

interface FeedState {
  listings: Listing[];
  filteredListings: Listing[];
  loading: boolean;
  searchQuery: string;
  activeCategory: string;
  lastFetched: number;
  fetch: (signal?: AbortSignal) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setCategory: (category: string) => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  listings: [],
  filteredListings: [],
  loading: false,
  searchQuery: '',
  activeCategory: 'all',
  lastFetched: 0,
  
  fetch: async (signal) => {
    const { lastFetched, listings } = get();
    // Cache check: If we fetched less than 30 seconds ago, don't re-fetch
    if (listings.length > 0 && Date.now() - lastFetched < 30000) {
      return;
    }

    set({ loading: true });
    try {
      const data = await db.getListings(signal);
      
      if (signal?.aborted) return;
      
      set({ 
        listings: data, 
        filteredListings: data,
        loading: false,
        lastFetched: Date.now()
      });
      
      const { searchQuery, activeCategory } = get();
      if (searchQuery || activeCategory !== 'all') {
        get().setSearchQuery(searchQuery);
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return;
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
