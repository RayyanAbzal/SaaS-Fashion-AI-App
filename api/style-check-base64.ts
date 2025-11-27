import { VercelRequest, VercelResponse } from '@vercel/node';
import { asyncHandler, errorHandler } from './utils/errorHandler';
import { handleCORS } from './utils/cors';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { performanceMiddleware } from './middleware/performance';
import { optionalAuth } from './middleware/auth';
import { validateRequest } from './utils/validation';
import { z } from 'zod';
import { cache, cacheKeys } from './utils/cache';

// Validation schema
const styleCheckBase64Schema = z.object({
  imageBase64: z.string().min(100, 'Invalid base64 image'),
  skinTone: z.enum(['fair', 'medium', 'deep']).optional(),
});

interface StyleAdvice {
  overallRating: number;
  overallRating10: number;
  overallFeedback: string;
  suggestions: string[];
  compliments: string[];
  occasions: string[];
  colorAnalysis: {
    dominantColors: string[];
    colorHarmony: string;
    colorAdvice: string;
  };
  fitAnalysis: {
    overallFit: string;
    fitAdvice: string;
  };
  styleAnalysis: {
    styleType: string;
    confidence: number;
    styleAdvice: string;
  };
  detectedItems?: Array<{
    type: string;
    color: string;
    confidence: number;
  }>;
}

// Simulated AI analysis (replace with actual OpenAI Vision API or similar)
async function analyzeOutfitBase64(imageBase64: string, skinTone?: string): Promise<StyleAdvice> {
  // In production, this would:
  // 1. Decode the base64 image
  // 2. Use OpenAI Vision API or Google Vision API to analyze
  // 3. Extract clothing items, colors, styles
  // 4. Generate personalized feedback
  
  // For now, return a simulated analysis
  return {
    overallRating: 4,
    overallRating10: 8,
    overallFeedback: 'Strong outfit. Consider balancing colors with a neutral accessory.',
    suggestions: [
      'Add a neutral accessory',
      'Tuck/untuck for proportion play',
      skinTone ? `Colors complement your ${skinTone} skin tone well` : 'Consider adding a statement piece'
    ],
    compliments: ['Good palette', 'Nice silhouette', 'Well-proportioned'],
    occasions: ['Casual Day', 'Coffee', 'Brunch'],
    colorAnalysis: {
      dominantColors: ['black', 'white', 'navy'],
      colorHarmony: 'good',
      colorAdvice: 'Ground bold colors with neutrals.'
    },
    fitAnalysis: {
      overallFit: 'good',
      fitAdvice: 'Top/bottom proportions look balanced.'
    },
    styleAnalysis: {
      styleType: 'casual',
      confidence: 75,
      styleAdvice: 'Add one elevated piece to finish.'
    },
    detectedItems: [
      { type: 'top', color: 'black', confidence: 85 },
      { type: 'bottom', color: 'navy', confidence: 80 },
      { type: 'shoes', color: 'white', confidence: 75 }
    ]
  };
}

async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (!handleCORS(req, res)) return;

  // Performance tracking
  performanceMiddleware(req, res);

  // Rate limiting (stricter for image processing)
  const rateLimitPassed = await rateLimitMiddleware(req, res, {
    limit: 5,
    window: 60, // 5 requests per minute
  });
  if (!rateLimitPassed) return;

  // Optional authentication
  await optionalAuth(req as any, res);

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Validate request
    validateRequest(styleCheckBase64Schema)(req, res);

    const { imageBase64, skinTone } = req.body;

    // Check cache (using hash of base64)
    const base64Hash = Buffer.from(imageBase64.substring(0, 100)).toString('base64');
    const cacheKey = cacheKeys.styleCheck(base64Hash, skinTone);
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return res.status(200).json({
        success: true,
        advice: cached
      });
    }

    console.log('🔍 Analyzing outfit image (base64)');

    // Analyze the outfit
    const advice = await analyzeOutfitBase64(imageBase64, skinTone);

    // Cache for 1 hour
    await cache.set(cacheKey, advice, 3600);

    res.status(200).json({
      success: true,
      advice
    });

  } catch (error) {
    errorHandler(error as Error, req, res);
  }
}

export default asyncHandler(handler);

