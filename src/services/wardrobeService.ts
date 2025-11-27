import { supabase } from './supabase';
import { WardrobeItem } from '../types';

export async function getUserWardrobe(userId: string, retries: number = 2): Promise<WardrobeItem[]> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        console.log(`Retrying getUserWardrobe (attempt ${attempt + 1}/${retries + 1})...`);
      }

      const { data, error } = await Promise.race([
        supabase
          .from('wardrobe_items')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        new Promise<{ data: null; error: Error }>((_, reject) =>
          setTimeout(() => reject(new Error('Wardrobe fetch timeout')), 20000)
        ),
      ]);

      if (error) {
        // If it's a network error and we have retries left, retry
        if (attempt < retries && (
          error.message?.includes('timeout') ||
          error.message?.includes('network') ||
          error.message?.includes('fetch')
        )) {
          continue;
        }
        console.error('Error fetching wardrobe:', error);
        return [];
      }

      return (data || []).map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    imageUrl: item.image_url,
    brand: item.brands || '',
    color: Array.isArray(item.colors) ? item.colors[0] : 'Unknown',
    colors: item.colors || [],
    tags: item.tags || [],
    userId: item.user_id,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
  } as WardrobeItem));
    } catch (error) {
      // If this is the last attempt, return empty array
      if (attempt === retries) {
        console.error('Error fetching wardrobe after retries:', error);
        return [];
      }
      // Otherwise, continue to next retry
      continue;
    }
  }
  
  return [];
}

export async function addWardrobeItem(item: Omit<WardrobeItem, 'id'>): Promise<string> {
  const { data, error } = await supabase
    .from('wardrobe_items')
    .insert([{
      user_id: item.userId,
      name: item.name,
      category: item.category,
      image_url: item.imageUrl,
      colors: item.colors || [item.color],
      brands: item.brand,
      tags: item.tags || [],
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding wardrobe item:', error);
    throw error;
  }

  return data.id;
}

export async function updateWardrobeItem(item: WardrobeItem): Promise<void> {
  const { error } = await supabase
    .from('wardrobe_items')
    .update({
      name: item.name,
      category: item.category,
      image_url: item.imageUrl,
      colors: item.colors || [item.color],
      brands: item.brand,
      tags: item.tags || [],
      updated_at: new Date().toISOString(),
    })
    .eq('id', item.id);

  if (error) {
    console.error('Error updating wardrobe item:', error);
    throw error;
  }
}

export async function deleteWardrobeItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('wardrobe_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    console.error('Error deleting wardrobe item:', error);
    throw error;
  }
}

export async function getWardrobeItems(): Promise<WardrobeItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  return getUserWardrobe(user.id);
}
