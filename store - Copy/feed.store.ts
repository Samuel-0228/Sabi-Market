
import { create } from 'zustand';
import { Listing } from '../types/index';
import { db } from '../services/supabase/db';

interface FeedState {
  listings: Listing[];
  filteredListings: Listing[];
  loading: boolean;
  searchQuery: string;
  activeCategory: string;
  sortBy: 'newest' | 'price_asc' | 'price_desc';
  lastFetched: number;
  fetch: (signal?: AbortSignal) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setCategory: (category: string) => void;
  setSortBy: (sort: 'newest' | 'price_asc' | 'price_desc') => void;
  smartSearch: (query: string) => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  listings: [],
  filteredListings: [],
  loading: false,
  searchQuery: '',
  activeCategory: 'all',
  sortBy: 'newest',
  lastFetched: 0,
  
  fetch: async (signal) => {
    const { lastFetched, listings, sortBy } = get();
    // Cache check: If we fetched less than 30 seconds ago, don't re-fetch
    if (listings.length > 0 && Date.now() - lastFetched < 30000) {
      return;
    }

    set({ loading: true });
    try {
      const data = await db.getListings(signal, sortBy);
      
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
  },

  setSortBy: (sort: 'newest' | 'price_asc' | 'price_desc') => {
    set({ sortBy: sort, lastFetched: 0 }); // Reset cache to force re-fetch with new sort
    get().fetch();
  },

  smartSearch: async (query: string) => {
    if (!query.trim()) {
      get().setSearchQuery('');
      return;
    }

    set({ loading: true });
    try {
      const { savvyAI } = await import('../services/ai/gemini');
      const result = await savvyAI.smartSearch(query);
      
      const { listings } = get();
      const filtered = listings.filter(l => {
        const matchesRefined = l.title.toLowerCase().includes(result.refinedQuery.toLowerCase()) || 
                              l.description.toLowerCase().includes(result.refinedQuery.toLowerCase());
        const matchesCategory = result.suggestedCategories.length === 0 || 
                               result.suggestedCategories.includes(l.category);
        return matchesRefined || matchesCategory;
      });

      set({ 
        searchQuery: query, 
        filteredListings: filtered, 
        loading: false,
        activeCategory: result.suggestedCategories[0] || 'all'
      });
    } catch (e) {
      console.error("Smart search failed", e);
      get().setSearchQuery(query); // Fallback to normal search
      set({ loading: false });
    }
  }
}));
