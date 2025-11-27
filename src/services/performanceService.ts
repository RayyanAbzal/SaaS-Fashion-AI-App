// Performance Optimization Service
// Aligned with PDF: "<300ms response time" target
// Implements caching, prefetching, and optimization strategies

import { cache, cacheKeys } from './mobileCache';
import { OutfitCombination } from './oracleService';
import { WardrobeItem } from '../types';

export interface PerformanceMetrics {
  cacheHitRate: number;
  averageResponseTime: number;
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
}

class PerformanceService {
  private static metrics: PerformanceMetrics = {
    cacheHitRate: 0,
    averageResponseTime: 0,
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  private static responseTimes: number[] = [];

  /**
   * Cache-aware outfit generation
   * Checks cache first, generates if miss, caches result
   */
  static async getCachedOrGenerateOutfits(
    userId: string,
    occasion: string,
    weather: string,
    count: number,
    generator: () => Promise<OutfitCombination[]>
  ): Promise<OutfitCombination[]> {
    const startTime = Date.now();
    const cacheKey = cacheKeys.outfitGeneration(userId, occasion, weather, count);

    // Check cache first (<100ms target)
    const cached = await cache.get(cacheKey);
    if (cached) {
      this.recordCacheHit();
      this.recordResponseTime(Date.now() - startTime);
      return cached;
    }

    // Cache miss - generate
    this.recordCacheMiss();
    const outfits = await generator();
    
    // Cache for 5 minutes (300 seconds)
    await cache.set(cacheKey, outfits, 300);
    
    this.recordResponseTime(Date.now() - startTime);
    return outfits;
  }

  /**
   * Prefetch outfits for likely next requests
   */
  static async prefetchOutfits(
    userId: string,
    occasions: string[],
    weather: string
  ): Promise<void> {
    // Prefetch in background (don't await)
    Promise.all(
      occasions.map(occasion =>
        this.getCachedOrGenerateOutfits(
          userId,
          occasion,
          weather,
          5,
          async () => {
            // Import here to avoid circular dependency
            const { OracleService } = await import('./oracleService');
            return OracleService.generateOutfitCombinations(
              occasion,
              weather,
              5,
              userId
            );
          }
        )
      )
    ).catch(error => {
      console.error('Prefetch error (non-critical):', error);
    });
  }

  /**
   * Parallel wardrobe and context loading
   */
  static async loadWardrobeAndContext(
    userId: string,
    loadWardrobe: () => Promise<WardrobeItem[]>,
    loadContext: () => Promise<any>
  ): Promise<{ wardrobe: WardrobeItem[]; context: any }> {
    const startTime = Date.now();
    
    // Load in parallel
    const [wardrobe, context] = await Promise.all([
      loadWardrobe(),
      loadContext(),
    ]);

    this.recordResponseTime(Date.now() - startTime);
    return { wardrobe, context };
  }

  /**
   * Batch outfit generation with caching
   */
  static async batchGenerateOutfits(
    requests: Array<{
      userId: string;
      occasion: string;
      weather: string;
      count: number;
    }>,
    generator: (req: typeof requests[0]) => Promise<OutfitCombination[]>
  ): Promise<OutfitCombination[][]> {
    const startTime = Date.now();

    // Check cache for all requests first
    const cacheChecks = await Promise.all(
      requests.map(req => {
        const cacheKey = cacheKeys.outfitGeneration(
          req.userId,
          req.occasion,
          req.weather,
          req.count
        );
        return cache.get(cacheKey);
      })
    );

    // Generate only for cache misses
    const results: OutfitCombination[][] = [];
    const generatePromises: Promise<void>[] = [];

    for (let i = 0; i < requests.length; i++) {
      if (cacheChecks[i]) {
        results[i] = cacheChecks[i];
        this.recordCacheHit();
      } else {
        this.recordCacheMiss();
        const promise = generator(requests[i]).then(outfits => {
          results[i] = outfits;
          const cacheKey = cacheKeys.outfitGeneration(
            requests[i].userId,
            requests[i].occasion,
            requests[i].weather,
            requests[i].count
          );
          return cache.set(cacheKey, outfits, 300);
        });
        generatePromises.push(promise);
      }
    }

    // Wait for all generations to complete
    await Promise.all(generatePromises);

    this.recordResponseTime(Date.now() - startTime);
    return results;
  }

  /**
   * Optimize database queries with batching
   */
  static async batchDatabaseQueries<T>(
    queries: Array<() => Promise<T>>,
    batchSize: number = 5
  ): Promise<T[]> {
    const startTime = Date.now();
    const results: T[] = [];

    // Execute in batches to avoid overwhelming database
    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(query => query()));
      results.push(...batchResults);
    }

    this.recordResponseTime(Date.now() - startTime);
    return results;
  }

  /**
   * Debounce expensive operations
   */
  static debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }

  /**
   * Throttle expensive operations
   */
  static throttle<T extends (...args: any[]) => any>(
    fn: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }

  /**
   * Record cache hit
   */
  private static recordCacheHit(): void {
    this.metrics.cacheHits++;
    this.metrics.totalRequests++;
    this.updateCacheHitRate();
  }

  /**
   * Record cache miss
   */
  private static recordCacheMiss(): void {
    this.metrics.cacheMisses++;
    this.metrics.totalRequests++;
    this.updateCacheHitRate();
  }

  /**
   * Update cache hit rate
   */
  private static updateCacheHitRate(): void {
    if (this.metrics.totalRequests > 0) {
      this.metrics.cacheHitRate =
        (this.metrics.cacheHits / this.metrics.totalRequests) * 100;
    }
  }

  /**
   * Record response time
   */
  private static recordResponseTime(time: number): void {
    this.responseTimes.push(time);
    
    // Keep only last 100 response times
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }

    // Calculate average
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    this.metrics.averageResponseTime = sum / this.responseTimes.length;
  }

  /**
   * Get performance metrics
   */
  static getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  static resetMetrics(): void {
    this.metrics = {
      cacheHitRate: 0,
      averageResponseTime: 0,
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
    this.responseTimes = [];
  }

  /**
   * Check if performance target is met (<300ms)
   */
  static isPerformanceTargetMet(): boolean {
    return this.metrics.averageResponseTime < 300;
  }
}

export default PerformanceService;

