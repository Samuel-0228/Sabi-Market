
import { supabase } from './supabase/client';
import { Rating } from '../types';

export const ratingService = {
  async createRating(rating: Omit<Rating, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('ratings')
      .insert([rating])
      .select()
      .single();
    
    if (error) throw error;
    return data as Rating;
  },

  async getRatingsForUser(userId: string) {
    const { data, error } = await supabase
      .from('ratings')
      .select(`
        *,
        reviewer:reviewer_id (full_name, avatar_url)
      `)
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getAverageRating(userId: string) {
    const { data, error } = await supabase
      .from('ratings')
      .select('rating')
      .eq('reviewee_id', userId);
    
    if (error) throw error;
    if (!data || data.length === 0) return 0;
    
    const sum = data.reduce((acc: number, curr: { rating: number }) => acc + curr.rating, 0);
    return sum / data.length;
  }
};
