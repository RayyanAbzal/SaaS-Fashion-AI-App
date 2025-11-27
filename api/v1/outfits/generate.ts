import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { asyncHandler, errorHandler } from '../../utils/errorHandler';
import { handleCORS } from '../../utils/cors';
import { rateLimitMiddleware, strictRateLimit } from '../../middleware/rateLimit';
import { performanceMiddleware } from '../../middleware/performance';
import { generateOutfitSchema, validateRequest } from '../../utils/validation';
import { authenticateRequest, AuthenticatedRequest } from '../../middleware/auth';
import { cache, cacheKeys } from '../../utils/cache';
import CountryRoadService from '../../../src/services/countryRoadService';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

interface OutfitItem {
  id: string;
  name: string;
  image: string;
  category: string;
  color: string;
  brand?: string;
  price?: string;
  isFromWardrobe: boolean;
}

interface OutfitCombination {
  id: string;
  items: OutfitItem[];
  summary: string;
  confidence: number;
  occasion: string;
  weather: string;
  score?: number;
  personalMatch?: number;
}

async function getWardrobe(userId: string): Promise<any[]> {
  if (!supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching wardrobe:', error);
    return [];
  }
}

async function getPinterestInsights(userId: string): Promise<any> {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('pinterest_boards')
      .select('style_insights')
      .eq('user_id', userId)
      .order('analysis_date', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) return null;
    return data.style_insights;
  } catch (error) {
    console.error('Error fetching Pinterest insights:', error);
    return null;
  }
}

async function getUserPreferences(userId: string): Promise<any> {
  if (!supabase) return {};
  
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Transform to preference map
    const preferences: any = {};
    (data || []).forEach((pref: any) => {
      if (!preferences[pref.preference_type]) {
        preferences[pref.preference_type] = {};
      }
      preferences[pref.preference_type][pref.preference_value] = pref.preference_score;
    });
    
    return preferences;
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return {};
  }
}

function scoreOutfit(outfit: OutfitCombination, preferences: any): number {
  let score = outfit.confidence * 100;
  
  // Boost score based on user preferences
  if (preferences.color) {
    outfit.items.forEach(item => {
      const colorScore = preferences.color[item.color] || 0.5;
      score += colorScore * 10;
    });
  }
  
  if (preferences.brand) {
    outfit.items.forEach(item => {
      if (item.brand) {
        const brandScore = preferences.brand[item.brand] || 0.5;
        score += brandScore * 5;
      }
    });
  }
  
  return Math.min(100, Math.max(0, score));
}

function calculatePersonalMatch(outfit: OutfitCombination, preferences: any): number {
  let match = 0;
  let factors = 0;
  
  // Color match
  if (preferences.color) {
    outfit.items.forEach(item => {
      const colorScore = preferences.color[item.color] || 0.5;
      match += colorScore;
      factors++;
    });
  }
  
  // Brand match
  if (preferences.brand) {
    outfit.items.forEach(item => {
      if (item.brand) {
        const brandScore = preferences.brand[item.brand] || 0.5;
        match += brandScore;
        factors++;
      }
    });
  }
  
  return factors > 0 ? match / factors : 0.5;
}

async function generateOutfits(params: {
  wardrobe: any[];
  occasion: string;
  weather: string;
  count: number;
  preferences: any;
  pinterestInsights: any;
}): Promise<OutfitCombination[]> {
  // This is a simplified version - in production, use your OracleService
  const outfits: OutfitCombination[] = [];
  
  // Get retail items as fallback
  const retailItems = await CountryRoadService.getItems();
  
  for (let i = 0; i < params.count; i++) {
    const outfit: OutfitCombination = {
      id: `outfit_${Date.now()}_${i}`,
      items: [
        {
          id: `item_${i}_1`,
          name: 'Sample Top',
          image: retailItems[i % retailItems.length]?.imageUrl || '',
          category: 'tops',
          color: 'black',
          brand: 'Country Road',
          isFromWardrobe: params.wardrobe.length > 0 && i % 2 === 0
        },
        {
          id: `item_${i}_2`,
          name: 'Sample Bottom',
          image: retailItems[(i + 1) % retailItems.length]?.imageUrl || '',
          category: 'bottoms',
          color: 'blue',
          brand: 'Country Road',
          isFromWardrobe: false
        }
      ],
      summary: `A ${params.occasion} outfit for ${params.weather} weather`,
      confidence: 0.7 + Math.random() * 0.2,
      occasion: params.occasion,
      weather: params.weather
    };
    
    outfit.score = scoreOutfit(outfit, params.preferences);
    outfit.personalMatch = calculatePersonalMatch(outfit, params.preferences);
    
    outfits.push(outfit);
  }
  
  return outfits;
}

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  // Handle CORS
  if (!handleCORS(req, res)) return;

  // Performance tracking
  performanceMiddleware(req, res);

  // Stricter rate limiting for expensive operation
  if (strictRateLimit) {
    const identifier = req.user?.id || req.headers['x-forwarded-for'] || req.ip || 'anonymous';
    const { success } = await strictRateLimit.limit(identifier as string);
    if (!success) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: 'Please wait before generating more outfits'
      });
    }
  }

  // Authentication required
  const authPassed = await authenticateRequest(req, res);
  if (!authPassed) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    // Validate request
    validateRequest(generateOutfitSchema)(req, res);

    const { userId, occasion, weather, count = 10, includePinterest } = req.body;
    
    // Verify userId matches authenticated user
    if (userId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'User ID does not match authenticated user'
      });
    }

    // Check cache
    const cacheKey = `outfit-generation:${userId}:${occasion}:${weather}:${count}:${includePinterest}`;
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return res.status(200).json(cached);
    }

    // Get user data
    const [wardrobe, pinterestInsights, preferences] = await Promise.all([
      getWardrobe(userId),
      includePinterest ? getPinterestInsights(userId) : Promise.resolve(null),
      getUserPreferences(userId)
    ]);

    // Generate outfits
    const outfits = await generateOutfits({
      wardrobe,
      occasion,
      weather,
      count,
      preferences,
      pinterestInsights
    });

    // Sort by score
    outfits.sort((a, b) => (b.score || 0) - (a.score || 0));

    const response = {
      success: true,
      outfits,
      metadata: {
        generated: outfits.length,
        occasion,
        weather,
        hasPinterestInsights: !!pinterestInsights,
        wardrobeItems: wardrobe.length
      }
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, response, 300);

    res.status(200).json(response);

  } catch (error) {
    errorHandler(error as Error, req, res);
  }
}

export default asyncHandler(handler);

