import { Redis } from '@upstash/redis';

// Initialize Redis client (will use environment variables)
let redis: Redis | null = null;

try {
  redis = Redis.fromEnv();
} catch (error) {
  console.warn('Redis not configured. Caching will be disabled.');
  console.warn('To enable caching, set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.');
}

export const cache = {
  get: async (key: string): Promise<any> => {
    if (!redis) return null;
    
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data as string) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },
  
  set: async (key: string, value: any, ttl: number = 3600): Promise<void> => {
    if (!redis) return;
    
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },
  
  delete: async (key: string): Promise<void> => {
    if (!redis) return;
    
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  },
  
  invalidate: async (pattern: string): Promise<void> => {
    if (!redis) return;
    
    try {
      // Note: Redis KEYS command can be slow in production
      // Consider using SCAN in production with large datasets
      const keys = await redis.keys(pattern);
      if (keys && keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  },
  
  exists: async (key: string): Promise<boolean> => {
    if (!redis) return false;
    
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }
};

// Cache key generators
export const cacheKeys = {
  countryRoadItems: (category?: string) => `country-road-items:${category || 'all'}`,
  retailProducts: (filters: string) => `retail-products:${filters}`,
  outfitAdvice: (occasion?: string, weather?: string) => `outfit-advice:${occasion || 'all'}:${weather || 'all'}`,
  pinterestAnalysis: (boardUrl: string) => `pinterest-analysis:${Buffer.from(boardUrl).toString('base64')}`,
  pinterestPinAnalysis: (pinUrl: string) => `pinterest-pin:${Buffer.from(pinUrl).toString('base64')}`,
  styleCheck: (imageId: string, skinTone?: string) => `style-check:${imageId}:${skinTone || 'none'}`,
  userWardrobe: (userId: string) => `wardrobe:${userId}`,
  userPreferences: (userId: string) => `preferences:${userId}`,
  outfitJob: (jobId: string) => `outfit-job:${jobId}`,
  outfitGeneration: (userId: string, occasion: string, weather: string, count: number) => 
    `outfit-gen:${userId}:${occasion}:${weather}:${count}`,
  perfumeRecommendation: (userId: string, occasion: string, weather: string) =>
    `perfume-rec:${userId}:${occasion}:${weather}`,
  weatherData: (lat: number, lon: number) => `weather:${lat.toFixed(2)}:${lon.toFixed(2)}`,
};

