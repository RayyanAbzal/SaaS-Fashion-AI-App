import { VercelRequest, VercelResponse } from '@vercel/node';

interface CountryRoadItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  subcategory: string;
  color: string;
  size: string;
  brand: string;
  material: string;
  description: string;
  url: string;
  inStock: boolean;
  seasonality: string[];
  formality: 'casual' | 'smart-casual' | 'business' | 'formal';
  weatherSuitability: {
    minTemp: number;
    maxTemp: number;
    conditions: string[];
  };
}


import { asyncHandler, errorHandler } from './utils/errorHandler';
import { scrapeCountryRoadProducts } from './utils/scraper';
import { handleCORS } from './utils/cors';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { performanceMiddleware } from './middleware/performance';
import { optionalAuth } from './middleware/auth';
import { cache, cacheKeys } from './utils/cache';


async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (!handleCORS(req, res)) return;

  // Performance tracking
  performanceMiddleware(req, res);

  // Rate limiting
  const rateLimitPassed = await rateLimitMiddleware(req, res);
  if (!rateLimitPassed) return;

  // Optional authentication
  await optionalAuth(req as any, res);

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    const category = req.query.category as string;
    
    // Check cache
    const cacheKey = cacheKeys.countryRoadItems(category);
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return res.status(200).json(cached);
    }
    
    console.log('Fetching Country Road items...');
    
    let items: CountryRoadItem[] = [];
    let source = 'scraped';
    
    try {
      // Scrape real products - NO FALLBACK DATA
      const scraped = await scrapeCountryRoadProducts(category);
      items = scraped.map(item => ({
        ...item,
        size: 'M', // Default size
        material: 'Unknown', // Would need to scrape product detail page
        description: item.name, // Use name as description
        seasonality: ['spring', 'summer', 'autumn', 'winter'],
      }));
      
      if (items.length === 0) {
        console.log('No items scraped - returning empty array');
        source = 'empty';
      }
    } catch (error) {
      console.error('Scraping failed - returning empty array:', error);
      items = [];
      source = 'error';
    }
    
    // Filter by category if provided
    if (category && items.length > 0 && source === 'scraped') {
      items = items.filter(item => 
        item.category.toLowerCase() === category.toLowerCase()
      );
    } else if (category && source === 'fallback') {
      items = items.filter(item => 
        item.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    const response = {
      success: true,
      items: items,
      count: items.length,
      source: source,
      category: category || 'all'
    };
    
    // Cache for 30 minutes
    await cache.set(cacheKey, response, 1800);
    
    console.log(`Returning ${items.length} Country Road items (source: ${source})`);
    res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching Country Road items:', error);
    
    // Return empty array on error - NO FALLBACK DATA
    const response = {
      success: true,
      items: [],
      count: 0,
      source: 'error',
      error: 'Scraping failed - no products available'
    };
    
    res.status(200).json(response);
  }
}

export default asyncHandler(handler);
