import { supabase } from './supabase';
import { SwipeHistory } from '../types';

export class SupabaseService {
  // Swipe History Operations
  static async addSwipeHistory(swipe: Omit<SwipeHistory, 'id'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('swipe_history')
        .insert([{
          user_id: swipe.userId,
          outfit_items: swipe.outfitId, // Store as JSONB
          action: swipe.action,
          occasion: swipe.occasion,
          weather: swipe.weather,
        }])
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error: any) {
      console.error('Error adding swipe history:', error);
      // Don't throw - fail gracefully
      return '';
    }
  }

  static async getSwipeHistory(userId: string, limit: number = 100): Promise<SwipeHistory[]> {
    try {
      const { data, error } = await supabase
        .from('swipe_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        outfitId: item.outfit_items,
        action: item.action,
        occasion: item.occasion,
        weather: item.weather,
        timestamp: new Date(item.created_at),
      } as SwipeHistory));
    } catch (error: any) {
      console.error('Error fetching swipe history:', error);
      return [];
    }
  }
}

