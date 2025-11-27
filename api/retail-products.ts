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

// Sample retail products from various Australian retailers
const retailProducts: RetailProduct[] = [
  // Country Road items
  {
    id: 'cr-white-shirt',
    name: 'Classic White Shirt',
    price: 89,
    originalPrice: 120,
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&h=300&fit=crop',
    category: 'Tops',
    subcategory: 'Shirts',
    color: 'White',
    brand: 'Country Road',
    url: 'https://countryroad.com.au/classic-white-shirt',
    inStock: true,
    formality: 'business',
    weatherSuitability: {
      minTemp: 15,
      maxTemp: 30,
      conditions: ['sunny', 'partly-cloudy']
    }
  },
  {
    id: 'cr-denim-jacket',
    name: 'Denim Jacket',
    price: 129,
    originalPrice: 159,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop',
    category: 'Outerwear',
    subcategory: 'Jackets',
    color: 'Blue',
    brand: 'Country Road',
    url: 'https://countryroad.com.au/denim-jacket',
    inStock: true,
    formality: 'casual',
    weatherSuitability: {
      minTemp: 10,
      maxTemp: 25,
      conditions: ['sunny', 'partly-cloudy', 'cloudy']
    }
  },
  // Witchery items
  {
    id: 'witchery-blazer',
    name: 'Tailored Blazer',
    price: 199,
    originalPrice: 249,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
    category: 'Outerwear',
    subcategory: 'Blazers',
    color: 'Black',
    brand: 'Witchery',
    url: 'https://witchery.com.au/tailored-blazer',
    inStock: true,
    formality: 'business',
    weatherSuitability: {
      minTemp: 10,
      maxTemp: 25,
      conditions: ['sunny', 'partly-cloudy', 'cloudy']
    }
  },
  {
    id: 'witchery-dress',
    name: 'Midi Dress',
    price: 149,
    originalPrice: 199,
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=300&fit=crop',
    category: 'Dresses',
    subcategory: 'Midi',
    color: 'Navy',
    brand: 'Witchery',
    url: 'https://witchery.com.au/midi-dress',
    inStock: true,
    formality: 'smart-casual',
    weatherSuitability: {
      minTemp: 15,
      maxTemp: 30,
      conditions: ['sunny', 'partly-cloudy']
    }
  },
  // Seed Heritage items
  {
    id: 'seed-heritage-jeans',
    name: 'High Rise Jeans',
    price: 89,
    originalPrice: 119,
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=300&fit=crop',
    category: 'Bottoms',
    subcategory: 'Jeans',
    color: 'Blue',
    brand: 'Seed Heritage',
    url: 'https://seedheritage.com.au/high-rise-jeans',
    inStock: true,
    formality: 'casual',
    weatherSuitability: {
      minTemp: 10,
      maxTemp: 30,
      conditions: ['sunny', 'partly-cloudy', 'cloudy']
    }
  },
  {
    id: 'seed-heritage-knit',
    name: 'Cable Knit Sweater',
    price: 79,
    originalPrice: 99,
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&h=300&fit=crop',
    category: 'Tops',
    subcategory: 'Sweaters',
    color: 'Cream',
    brand: 'Seed Heritage',
    url: 'https://seedheritage.com.au/cable-knit-sweater',
    inStock: true,
    formality: 'smart-casual',
    weatherSuitability: {
      minTemp: 5,
      maxTemp: 20,
      conditions: ['cloudy', 'rainy']
    }
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
    
    let filteredProducts = [...retailProducts];
    
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
    
    console.log(`Returning ${filteredProducts.length} retail products`);
    res.status(200).json(response);

  } catch (error) {
    errorHandler(error as Error, req, res);
  }
}

export default asyncHandler(handler);
