import { VercelRequest, VercelResponse } from '@vercel/node';
import { asyncHandler, errorHandler } from './utils/errorHandler';
import { handleCORS } from './utils/cors';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { performanceMiddleware } from './middleware/performance';
import { outfitRequestSchema, validateRequest } from './utils/validation';
import { cache, cacheKeys } from './utils/cache';
import { optionalAuth } from './middleware/auth';

interface OutfitAdvice {
  id: string;
  title: string;
  description: string;
  occasion: string;
  weather: string;
  tips: string[];
  items: string[];
}

const outfitAdvice: OutfitAdvice[] = [
  {
    id: 'work-casual',
    title: 'Smart Casual for Work',
    description: 'Perfect for casual Fridays or creative workplaces',
    occasion: 'work',
    weather: 'mild',
    tips: [
      'Pair a blazer with dark jeans',
      'Add a statement accessory',
      'Keep shoes polished and comfortable'
    ],
    items: ['Blazer', 'Dark Jeans', 'Button-up Shirt', 'Loafers']
  },
  {
    id: 'date-night',
    title: 'Date Night Elegance',
    description: 'Sophisticated yet approachable for evening dates',
    occasion: 'date',
    weather: 'warm',
    tips: [
      'Choose one statement piece',
      'Keep accessories minimal',
      'Ensure comfort for walking'
    ],
    items: ['Midi Dress', 'Blazer', 'Heels', 'Clutch']
  },
  {
    id: 'weekend-casual',
    title: 'Weekend Comfort',
    description: 'Relaxed and comfortable for weekend activities',
    occasion: 'casual',
    weather: 'mild',
    tips: [
      'Layer for changing temperatures',
      'Choose comfortable shoes',
      'Add a pop of color'
    ],
    items: ['Sweater', 'Jeans', 'Sneakers', 'Crossbody Bag']
  },
  {
    id: 'party-ready',
    title: 'Party Perfect',
    description: 'Stand out at social events and parties',
    occasion: 'party',
    weather: 'warm',
    tips: [
      'Choose bold colors or patterns',
      'Add statement jewelry',
      'Consider the venue dress code'
    ],
    items: ['Statement Top', 'Tailored Pants', 'Heels', 'Bold Accessories']
  }
];

async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (!handleCORS(req, res)) return;

  // Performance tracking
  performanceMiddleware(req, res);

  // Rate limiting
  const rateLimitPassed = await rateLimitMiddleware(req, res);
  if (!rateLimitPassed) return;

  // Optional authentication (for analytics)
  await optionalAuth(req as any, res);

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    // Validate request
    validateRequest(outfitRequestSchema)(req, res);

    const { occasion, weather } = req.query;
    
    // Check cache
    const cacheKey = cacheKeys.outfitAdvice(
      occasion as string,
      weather as string
    );
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return res.status(200).json(cached);
    }
    
    let filteredAdvice = [...outfitAdvice];
    
    // Filter by occasion
    if (occasion) {
      filteredAdvice = filteredAdvice.filter(advice => 
        advice.occasion === occasion
      );
    }
    
    // Filter by weather
    if (weather) {
      filteredAdvice = filteredAdvice.filter(advice => 
        advice.weather === weather
      );
    }
    
    const response = {
      success: true,
      advice: filteredAdvice,
      count: filteredAdvice.length,
      filters: {
        occasion,
        weather
      }
    };
    
    // Cache for 1 hour (static content)
    await cache.set(cacheKey, response, 3600);
    
    res.status(200).json(response);

  } catch (error) {
    errorHandler(error as Error, req, res);
  }
}

export default asyncHandler(handler);
