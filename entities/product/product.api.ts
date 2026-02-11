
import { supabase } from '../../shared/lib/supabase';
import { Listing } from '../../types';

export const productApi = {
  async fetchListings(signal?: AbortSignal): Promise<Listing[]> {
    const query = supabase
      .from('listings')
      .select('*, profiles:seller_id(full_name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (signal) query.abortSignal(signal);

    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).map((l: any) => ({
      ...l,
      seller_name: l.profiles?.full_name || 'AAU Student'
    }));
  },

  async create(listing: Partial<Listing>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Auth required");
    
    const { data, error } = await supabase
      .from('listings')
      .insert({
        ...listing,
        seller_id: user.id,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
