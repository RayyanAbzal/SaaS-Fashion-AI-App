import { supabase, isSupabaseConfigured } from './supabase';

export interface Perfume {
  id: string;
  userId: string;
  name: string;
  brand?: string;
  notes?: {
    top: string[];
    middle: string[];
    base: string[];
  };
  seasonality?: string[]; // ['spring', 'summer', 'fall', 'winter']
  occasion?: string[]; // ['day', 'night', 'casual', 'formal', 'date', 'work']
  projection?: 'intimate' | 'moderate' | 'strong' | 'beast-mode';
  longevity?: 'short' | 'moderate' | 'long' | 'very-long';
  sillage?: 'close' | 'moderate' | 'strong';
  weatherCompatibility?: string[]; // ['cold', 'mild', 'warm', 'hot']
  timeOfDay?: string[]; // ['morning', 'afternoon', 'evening', 'night']
  mood?: string[]; // ['fresh', 'warm', 'spicy', 'floral', 'woody', 'citrus']
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerfumeRecommendation {
  perfume: Perfume;
  sprayCount: number; // 1-5 sprays
  reasoning: string;
  confidence: number; // 0-1
  matchScore: number; // 0-100
}

interface RecommendationContext {
  weather?: {
    temperature: number;
    condition: string;
  };
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  occasion?: 'casual' | 'professional' | 'date' | 'party' | 'formal';
  outfitStyle?: string;
  mood?: string;
}

class PerfumeService {
  /**
   * Get user's perfume collection
   */
  static async getUserPerfumes(userId: string, retries: number = 2): Promise<Perfume[]> {
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured - returning empty perfumes');
      return [];
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }

        const { data, error } = await Promise.race([
          supabase
            .from('perfumes')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
          new Promise<{ data: null; error: Error }>((_, reject) =>
            setTimeout(() => reject(new Error('Perfumes fetch timeout')), 20000)
          ),
        ]);

      if (error) {
        // If table doesn't exist, return empty array (graceful degradation)
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.warn('⚠️ Perfumes table not found. Run database migrations. See DATABASE_SETUP.md');
          return [];
        }
        
        if (attempt < retries && (
          error.message?.includes('timeout') ||
          error.message?.includes('network') ||
          error.message?.includes('fetch')
        )) {
          continue;
        }
        console.error('Error fetching perfumes:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        name: item.name,
        brand: item.brand,
        notes: item.notes,
        seasonality: item.seasonality || [],
        occasion: item.occasion || [],
        projection: item.projection,
        longevity: item.longevity,
        sillage: item.sillage,
        weatherCompatibility: item.weather_compatibility || [],
        timeOfDay: item.time_of_day || [],
        mood: item.mood || [],
        imageUrl: item.image_url,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      }));

        return perfumes;
      } catch (error) {
        if (attempt === retries) {
          console.error('Error fetching perfumes after retries:', error);
          return [];
        }
        continue;
      }
    }
    
    return [];
  }

  /**
   * Add a perfume to user's collection
   */
  static async addPerfume(userId: string, perfume: Omit<Perfume, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    try {
      const { data, error } = await supabase
        .from('perfumes')
        .insert([{
          user_id: userId,
          name: perfume.name,
          brand: perfume.brand,
          notes: perfume.notes,
          seasonality: perfume.seasonality,
          occasion: perfume.occasion,
          projection: perfume.projection,
          longevity: perfume.longevity,
          sillage: perfume.sillage,
          weather_compatibility: perfume.weatherCompatibility,
          time_of_day: perfume.timeOfDay,
          mood: perfume.mood,
          image_url: perfume.imageUrl,
        }])
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error adding perfume:', error);
      throw error;
    }
  }

  /**
   * Recommend perfume based on context
   * Optimized with caching for <300ms target
   */
  static async recommendPerfume(
    userId: string,
    context: RecommendationContext
  ): Promise<PerfumeRecommendation | null> {
    // Get cache and cacheKeys
    let cache: any = null;
    let cacheKeys: any = null;
    let cacheKey: string = '';
    
    try {
      const cacheModule = await import('./mobileCache');
      cache = cacheModule.cache;
      cacheKeys = cacheModule.cacheKeys;
      cacheKey = cacheKeys.perfumeRecommendation(
        userId,
        context.occasion || 'casual',
        `${context.weather?.temperature || '20'}`
      );
      
      // Check cache first
      const cached = await cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (error) {
      console.warn('Cache check failed, continuing without cache:', error);
    }

    const perfumes = await this.getUserPerfumes(userId);

    let recommendation: PerfumeRecommendation | null;
    
    if (perfumes.length === 0) {
      // Return a default recommendation if no perfumes
      recommendation = this.getDefaultRecommendation(context);
    } else {
      // Score each perfume based on context
      const scoredPerfumes = perfumes.map(perfume => ({
        perfume,
        score: this.calculateMatchScore(perfume, context),
      }));

      // Sort by score and get top match
      scoredPerfumes.sort((a, b) => b.score - a.score);
      const topMatch = scoredPerfumes[0];

      if (topMatch.score < 30) {
        // If no good match, return default
        recommendation = this.getDefaultRecommendation(context);
      } else {
        recommendation = {
          perfume: topMatch.perfume,
          sprayCount: this.calculateSprayCount(topMatch.perfume, context),
          reasoning: this.generateReasoning(topMatch.perfume, context, topMatch.score),
          confidence: topMatch.score / 100,
          matchScore: topMatch.score,
        };
      }
    }

    // Cache result for 5 minutes
    if (cache && cacheKey) {
      try {
        await cache.set(cacheKey, recommendation, 300);
      } catch (error) {
        console.warn('Cache set failed (non-critical):', error);
      }
    }

    return recommendation;
  }

  /**
   * Calculate match score between perfume and context
   */
  private static calculateMatchScore(perfume: Perfume, context: RecommendationContext): number {
    let score = 50; // Base score

    // Weather matching
    if (context.weather && perfume.weatherCompatibility) {
      const temp = context.weather.temperature;
      const weatherType = temp < 10 ? 'cold' : temp < 20 ? 'mild' : temp < 28 ? 'warm' : 'hot';
      if (perfume.weatherCompatibility.includes(weatherType)) {
        score += 20;
      }
    }

    // Time of day matching
    if (context.timeOfDay && perfume.timeOfDay) {
      if (perfume.timeOfDay.includes(context.timeOfDay)) {
        score += 15;
      }
    }

    // Occasion matching
    if (context.occasion && perfume.occasion) {
      if (perfume.occasion.includes(context.occasion)) {
        score += 15;
      }
    }

    // Season matching (infer from weather)
    if (context.weather && perfume.seasonality) {
      const month = new Date().getMonth();
      const season = month < 3 ? 'winter' : month < 6 ? 'spring' : month < 9 ? 'summer' : 'fall';
      if (perfume.seasonality.includes(season)) {
        score += 10;
      }
    }

    // Projection adjustment based on occasion
    if (context.occasion === 'professional' && perfume.projection === 'intimate') {
      score += 10; // Prefer subtle for work
    } else if (context.occasion === 'party' && perfume.projection === 'strong') {
      score += 10; // Prefer strong for parties
    }

    return Math.min(100, score);
  }

  /**
   * Calculate spray count based on perfume and context
   */
  private static calculateSprayCount(perfume: Perfume, context: RecommendationContext): number {
    let baseSprays = 2; // Default

    // Adjust based on projection
    if (perfume.projection === 'intimate') {
      baseSprays = 3;
    } else if (perfume.projection === 'moderate') {
      baseSprays = 2;
    } else if (perfume.projection === 'strong') {
      baseSprays = 1;
    } else if (perfume.projection === 'beast-mode') {
      baseSprays = 1;
    }

    // Adjust based on occasion
    if (context.occasion === 'professional') {
      baseSprays = Math.max(1, baseSprays - 1); // Less for work
    } else if (context.occasion === 'party') {
      baseSprays = Math.min(5, baseSprays + 1); // More for parties
    }

    // Adjust based on weather (more sprays in cold weather)
    if (context.weather && context.weather.temperature < 15) {
      baseSprays = Math.min(5, baseSprays + 1);
    }

    return Math.max(1, Math.min(5, baseSprays));
  }

  /**
   * Generate detailed reasoning for recommendation
   */
  private static generateReasoning(perfume: Perfume, context: RecommendationContext, score: number): string {
    const reasons: string[] = [];
    const temp = context.weather?.temperature || 20;
    const weatherType = temp < 10 ? 'cold' : temp < 20 ? 'mild' : temp < 28 ? 'warm' : 'hot';
    const occasion = context.occasion || 'casual';

    // Weather-specific reasoning
    if (context.weather && perfume.weatherCompatibility) {
      if (perfume.weatherCompatibility.includes(weatherType)) {
        if (weatherType === 'hot' || weatherType === 'warm') {
          reasons.push(`Perfect for ${weatherType} weather - lighter notes won't feel overwhelming in the heat`);
        } else if (weatherType === 'cold') {
          reasons.push(`Ideal for ${weatherType} weather - richer, warmer notes will project well in cooler temperatures`);
        } else {
          reasons.push(`Great for ${weatherType} weather - balanced projection that works in moderate temperatures`);
        }
      }
    }

    // Occasion-specific reasoning
    if (perfume.occasion?.includes(occasion)) {
      if (occasion === 'professional') {
        reasons.push(`Professional setting appropriate - ${perfume.projection === 'intimate' ? 'subtle' : 'moderate'} projection won't distract colleagues`);
      } else if (occasion === 'date') {
        reasons.push(`Perfect for ${occasion} - ${perfume.mood?.[0] || 'alluring'} notes create an inviting presence`);
      } else if (occasion === 'party') {
        reasons.push(`Great for ${occasion} - ${perfume.projection === 'strong' ? 'bold' : 'confident'} projection ensures you stand out`);
      } else {
        reasons.push(`Versatile for ${occasion} occasions - balanced character works throughout the day`);
      }
    }

    // Time of day reasoning
    if (context.timeOfDay) {
      if (context.timeOfDay === 'morning' && perfume.projection === 'intimate') {
        reasons.push('Morning-friendly - subtle start that won\'t overwhelm early in the day');
      } else if (context.timeOfDay === 'evening' && perfume.projection === 'strong') {
        reasons.push('Evening-appropriate - stronger projection perfect for night-time events');
      }
    }

    // Projection reasoning
    if (perfume.projection === 'intimate' && context.occasion === 'professional') {
      reasons.push('Workplace-appropriate - intimate projection stays close, perfect for office environments');
    } else if (perfume.projection === 'strong' && (context.occasion === 'party' || context.occasion === 'date')) {
      reasons.push('Strong projection - ensures your scent is noticed in social settings');
    }

    // Mood/notes reasoning
    if (perfume.mood && perfume.mood.length > 0) {
      const primaryMood = perfume.mood[0];
      if (primaryMood === 'fresh' || primaryMood === 'clean') {
        reasons.push(`${primaryMood.charAt(0).toUpperCase() + primaryMood.slice(1)} notes keep you feeling refreshed throughout the day`);
      } else if (primaryMood === 'warm' || primaryMood === 'spicy') {
        reasons.push(`${primaryMood.charAt(0).toUpperCase() + primaryMood.slice(1)} notes add depth and sophistication to your presence`);
      } else {
        reasons.push(`${primaryMood.charAt(0).toUpperCase() + primaryMood.slice(1)} character complements your style and enhances confidence`);
      }
    }

    // Match score reasoning
    if (score >= 80) {
      reasons.push(`Excellent match (${score}%) - this fragrance aligns perfectly with your current context and preferences`);
    } else if (score >= 60) {
      reasons.push(`Good match (${score}%) - well-suited for today's conditions and occasion`);
    }

    if (reasons.length === 0) {
      return `A versatile choice that works well for today's context. The balanced character makes it suitable for ${occasion} occasions in ${weatherType} weather.`;
    }

    return reasons.join(' ') + '.';
  }

  /**
   * Get default recommendation when user has no perfumes
   */
  private static getDefaultRecommendation(context: RecommendationContext): PerfumeRecommendation {
    const defaultPerfume: Perfume = {
      id: 'default',
      userId: '',
      name: 'Versatile Daily Fragrance',
      brand: 'Recommended',
      notes: {
        top: ['citrus', 'bergamot'],
        middle: ['lavender', 'jasmine'],
        base: ['musk', 'amber'],
      },
      occasion: ['casual', 'professional'],
      projection: 'moderate',
      longevity: 'moderate',
      weatherCompatibility: ['mild', 'warm'],
      timeOfDay: ['morning', 'afternoon'],
      mood: ['fresh', 'clean'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      perfume: defaultPerfume,
      sprayCount: 2,
      reasoning: 'A versatile, crowd-pleasing fragrance that works for most occasions. Consider adding perfumes to your collection for more personalized recommendations!',
      confidence: 0.5,
      matchScore: 50,
    };
  }

  /**
   * Get multiple perfume recommendations (for swiping)
   */
  static async getMultipleRecommendations(
    userId: string,
    context: RecommendationContext,
    count: number = 3
  ): Promise<PerfumeRecommendation[]> {
    const perfumes = await this.getUserPerfumes(userId);

    if (perfumes.length === 0) {
      return [this.getDefaultRecommendation(context)];
    }

    // Score all perfumes
    const scoredPerfumes = perfumes.map(perfume => ({
      perfume,
      score: this.calculateMatchScore(perfume, context),
    }));

    // Sort by score and get top N
    scoredPerfumes.sort((a, b) => b.score - a.score);
    const topMatches = scoredPerfumes.slice(0, count);

    return topMatches.map(match => ({
      perfume: match.perfume,
      sprayCount: this.calculateSprayCount(match.perfume, context),
      reasoning: this.generateReasoning(match.perfume, context, match.score),
      confidence: match.score / 100,
      matchScore: match.score,
    }));
  }
}

export default PerfumeService;

