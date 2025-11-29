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

// Fallback items when scraping fails
const fallbackItems: CountryRoadItem[] = [
  {
    id: 'cr-1',
    name: 'Classic White Shirt',
    price: 89,
    originalPrice: 120,
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&h=300&fit=crop',
    category: 'Tops',
    subcategory: 'Shirts',
    color: 'White',
    size: 'M',
    brand: 'Country Road',
    material: 'Cotton',
    description: 'Classic white cotton shirt perfect for work or casual wear',
    url: 'https://countryroad.com.au/classic-white-shirt',
    inStock: true,
    seasonality: ['spring', 'summer', 'autumn'],
    formality: 'business',
    weatherSuitability: {
      minTemp: 15,
      maxTemp: 30,
      conditions: ['sunny', 'partly-cloudy']
    }
  },
  {
    id: 'cr-2',
    name: 'Denim Jacket',
    price: 129,
    originalPrice: 159,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop',
    category: 'Outerwear',
    subcategory: 'Jackets',
    color: 'Blue',
    size: 'M',
    brand: 'Country Road',
    material: 'Denim',
    description: 'Classic denim jacket for casual styling',
    url: 'https://countryroad.com.au/denim-jacket',
    inStock: true,
    seasonality: ['spring', 'autumn'],
    formality: 'casual',
    weatherSuitability: {
      minTemp: 10,
      maxTemp: 25,
      conditions: ['sunny', 'partly-cloudy', 'cloudy']
    }
  },
  {
    id: 'cr-3',
    name: 'Black Trousers',
    price: 99,
    originalPrice: 129,
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=300&fit=crop',
    category: 'Bottoms',
    subcategory: 'Trousers',
    color: 'Black',
    size: 'M',
    brand: 'Country Road',
    material: 'Wool Blend',
    description: 'Professional black trousers for work',
    url: 'https://countryroad.com.au/black-trousers',
    inStock: true,
    seasonality: ['autumn', 'winter', 'spring'],
    formality: 'business',
    weatherSuitability: {
      minTemp: 5,
      maxTemp: 25,
      conditions: ['sunny', 'partly-cloudy', 'cloudy']
    }
  },
  {
    id: 'cr-4',
    name: 'Knit Sweater',
    price: 79,
    originalPrice: 99,
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&h=300&fit=crop',
    category: 'Tops',
    subcategory: 'Sweaters',
    color: 'Navy',
    size: 'M',
    brand: 'Country Road',
    material: 'Wool',
    description: 'Warm knit sweater for cooler weather',
    url: 'https://countryroad.com.au/knit-sweater',
    inStock: true,
    seasonality: ['autumn', 'winter'],
    formality: 'smart-casual',
    weatherSuitability: {
      minTemp: 0,
      maxTemp: 20,
      conditions: ['cloudy', 'rainy']
    }
  }
];

import { asyncHandler, errorHandler } from './utils/errorHandler';
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
      // Attempt to scrape real products
      const scraped = await scrapeCountryRoadProducts(category);
      items = scraped.map(item => ({
        ...item,
        size: 'M', // Default size
        material: 'Unknown', // Would need to scrape product detail page
        description: item.name, // Use name as description
        seasonality: ['spring', 'summer', 'autumn', 'winter'],
      }));
      
      // If scraping returned no items, use fallback
      if (items.length === 0) {
        console.log('No items scraped, using fallback data');
        items = fallbackItems;
        source = 'fallback';
      }
    } catch (error) {
      console.error('Scraping failed, using fallback data:', error);
      items = fallbackItems;
      source = 'fallback';
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
    
    // Return fallback items on error
    const response = {
      success: true,
      items: fallbackItems,
      count: fallbackItems.length,
      source: 'fallback',
      error: 'Using fallback data'
    };
    
    res.status(200).json(response);
  }
}

export default asyncHandler(handler);
