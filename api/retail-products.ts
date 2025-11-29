import { scrapeCountryRoadProducts } from './utils/scraper';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { asyncHandler, errorHandler } from './utils/errorHandler';

import { handleCORS } from './utils/cors';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { performanceMiddleware } from './middleware/performance';
import { optionalAuth } from './middleware/auth';
import { cache, cacheKeys } from './utils/cache';

interface RetailProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  subcategory: string;
  color: string;
  brand: string;
  url: string;
  inStock: boolean;
  formality: 'casual' | 'smart-casual' | 'business' | 'formal';
  weatherSuitability: {
    minTemp: number;
    maxTemp: number;
    conditions: string[];
  };
}


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
    const { category, color, formality, minTemp, maxTemp } = req.query;
    
    // Create cache key from filters
    const filterKey = JSON.stringify({ category, color, formality, minTemp, maxTemp });
    const cacheKey = cacheKeys.retailProducts(filterKey);
    
    // Check cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }
    
    // Fetch ONLY real scraped products - NO STATIC DATA
    let allProducts: RetailProduct[] = [];
    let source: 'scraped' | 'empty' | 'error' = 'empty';
    
    try {
      // Scrape Country Road products directly
      const scrapedProducts = await scrapeCountryRoadProducts(category as string);
      
      if (scrapedProducts && scrapedProducts.length > 0) {
        // Convert scraped products to RetailProduct format
        const convertedProducts: RetailProduct[] = scrapedProducts.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          originalPrice: item.originalPrice,
          image: item.image,
          category: item.category,
          subcategory: item.subcategory,
          color: item.color,
          brand: item.brand,
          url: item.url,
          inStock: item.inStock,
          formality: item.formality,
          weatherSuitability: item.weatherSuitability,
        }));
        
        allProducts = convertedProducts; // ONLY scraped products
        source = 'scraped';
        console.log(`Fetched ${convertedProducts.length} products from Country Road scraper`);
      } else {
        allProducts = [];
        source = 'empty';
        console.log('No products scraped - returning empty array');
      }
    } catch (error) {
      console.error('Error scraping Country Road products:', error);
      // Return empty array - NO STATIC FALLBACK
      allProducts = [];
      source = 'error';
    }
    
    let filteredProducts = allProducts;
    
    // Filter by category
    if (category) {
      filteredProducts = filteredProducts.filter(product => 
        product.category.toLowerCase().includes(category.toString().toLowerCase()) ||
        product.subcategory.toLowerCase().includes(category.toString().toLowerCase())
      );
    }
    
    // Filter by color
    if (color) {
      filteredProducts = filteredProducts.filter(product => 
        product.color.toLowerCase().includes(color.toString().toLowerCase())
      );
    }
    
    // Filter by formality
    if (formality) {
      filteredProducts = filteredProducts.filter(product => 
        product.formality === formality
      );
    }
    
    // Filter by temperature
    if (minTemp && maxTemp) {
      const min = parseInt(minTemp.toString());
      const max = parseInt(maxTemp.toString());
      filteredProducts = filteredProducts.filter(product => 
        product.weatherSuitability.minTemp <= max &&
        product.weatherSuitability.maxTemp >= min
      );
    }
    
    const response = {
      success: true,
      products: filteredProducts,
      count: filteredProducts.length,
      source: source,
      filters: {
        category,
        color,
        formality,
        minTemp,
        maxTemp
      }
    };
    
    // Cache for 30 minutes
    await cache.set(cacheKey, response, 1800);
    
    console.log(`Returning ${filteredProducts.length} retail products (source: ${source})`);
    res.status(200).json(response);

  } catch (error) {
    errorHandler(error as Error, req, res);
  }
}

export default asyncHandler(handler);
