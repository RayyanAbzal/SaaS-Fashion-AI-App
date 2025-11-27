// Mobile-Compatible Cache Service
// Uses AsyncStorage for React Native (no server-side dependencies)
// Aligned with PDF: Caching strategy for <300ms performance

import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MobileCache {
  private static readonly PREFIX = 'stylemate_cache:';
  private static readonly DEFAULT_TTL = 300; // 5 minutes

  /**
   * Get cached value
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = this.PREFIX + key;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const entry: CacheEntry<T> = JSON.parse(cached);
      
      // Check if expired
      if (Date.now() > entry.expiresAt) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }
      
      return entry.value;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached value with TTL
   */
  static async set<T>(key: string, value: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const cacheKey = this.PREFIX + key;
      const entry: CacheEntry<T> = {
        value,
        expiresAt: Date.now() + (ttl * 1000),
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  /**
   * Delete cached value
   */
  static async delete(key: string): Promise<void> {
    try {
      const cacheKey = this.PREFIX + key;
      await AsyncStorage.removeItem(cacheKey);
    } catch (error) {
      console.warn('Cache delete error:', error);
    }
  }

  /**
   * Check if key exists and is valid
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const cached = await this.get(key);
      return cached !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all cache entries
   */
  static async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  /**
   * Invalidate cache by pattern (simple prefix matching)
   */
  static async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.startsWith(this.PREFIX) && key.includes(pattern)
      );
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.warn('Cache invalidate error:', error);
    }
  }
}

// Cache key generators (same as server-side)
export const cacheKeys = {
  outfitGeneration: (userId: string, occasion: string, weather: string, count: number) => 
    `outfit-gen:${userId}:${occasion}:${weather}:${count}`,
  perfumeRecommendation: (userId: string, occasion: string, weather: string) =>
    `perfume-rec:${userId}:${occasion}:${weather}`,
  weatherData: (lat: number, lon: number) => `weather:${lat.toFixed(2)}:${lon.toFixed(2)}`,
  userWardrobe: (userId: string) => `wardrobe:${userId}`,
  userPreferences: (userId: string) => `preferences:${userId}`,
};

export const cache = MobileCache;
export default MobileCache;

