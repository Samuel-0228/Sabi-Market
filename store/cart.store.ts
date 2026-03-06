
import { create } from 'zustand';
import { CartItem } from '../types';
import { db } from '../services/supabase/db';

interface CartState {
  items: CartItem[];
  loading: boolean;
  initialized: boolean;
  
  fetchCart: (userId: string) => Promise<void>;
  addItem: (userId: string, productId: string, quantity?: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: (userId: string) => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  loading: false,
  initialized: false,

  fetchCart: async (userId: string) => {
    set({ loading: true });
    try {
      const items = await db.getCartItems(userId);
      set({ items: items as CartItem[], initialized: true });
    } catch (err) {
      console.error("Cart fetch error:", err);
    } finally {
      set({ loading: false });
    }
  },

  addItem: async (userId: string, productId: string, quantity = 1) => {
    try {
      await db.addToCart(userId, productId, quantity);
      // Refresh cart to get full listing data
      const items = await db.getCartItems(userId);
      set({ items: items as CartItem[] });
    } catch (err) {
      console.error("Add to cart error:", err);
      throw err;
    }
  },

  removeItem: async (itemId: string) => {
    // Optimistic update
    const previousItems = get().items;
    set({ items: previousItems.filter(i => i.id !== itemId) });
    
    try {
      await db.removeFromCart(itemId);
    } catch (err) {
      set({ items: previousItems });
      console.error("Remove from cart error:", err);
      throw err;
    }
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      return get().removeItem(itemId);
    }

    const previousItems = get().items;
    set({ 
      items: previousItems.map(i => i.id === itemId ? { ...i, quantity } : i) 
    });

    try {
      await db.updateCartQuantity(itemId, quantity);
    } catch (err) {
      set({ items: previousItems });
      console.error("Update quantity error:", err);
      throw err;
    }
  },

  clearCart: async (userId: string) => {
    set({ items: [] });
    try {
      await db.clearCart(userId);
    } catch (err) {
      console.error("Clear cart error:", err);
    }
  },

  getTotal: () => {
    return get().items.reduce((sum, item) => {
      return sum + (item.listing?.price || 0) * item.quantity;
    }, 0);
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  }
}));
