
import { dbService } from '../../services/supabase/db';
import { Listing } from '../../types';

export const productApi = {
  async fetchListings(): Promise<Listing[]> {
    const { data, error } = await dbService.getListings();
    if (error) throw error;
    return (data || []).map(l => ({ ...l, seller_name: (l as any).profiles?.full_name || 'Verified Seller' }));
  },
  async postListing(listing: Partial<Listing>) {
    const { error } = await dbService.createListing(listing);
    if (error) throw error;
  }
};
