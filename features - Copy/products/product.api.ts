
import { db } from '../../services/supabase/db';
import { Listing } from '../../types/index';

export const productApi = {
  async fetchListings(): Promise<Listing[]> {
    const data = await db.getListings();
    return (data || []).map(l => ({ 
      ...l, 
      seller_name: (l as any).profiles?.full_name || 'Verified Seller' 
    }));
  },
  async postListing(listing: Partial<Listing>) {
    await db.createListing(listing);
  }
};
