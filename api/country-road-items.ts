import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import * as cheerio from 'cheerio';

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

// Helper function to extract price from text
function extractPrice(priceText: string): number {
  const match = priceText.match(/[\d,]+\.?\d*/);
  if (match) {
    return parseFloat(match[0].replace(/,/g, ''));
  }
  return 0;
}

// Helper function to infer category from URL or product name
function inferCategory(url: string, name: string): { category: string; subcategory: string } {
  const urlLower = url.toLowerCase();
  const nameLower = name.toLowerCase();
  
  // Category mapping
  if (urlLower.includes('shirt') || urlLower.includes('top') || nameLower.includes('shirt') || nameLower.includes('top')) {
    return { category: 'Tops', subcategory: 'Shirts' };
  }
  if (urlLower.includes('jacket') || nameLower.includes('jacket')) {
    return { category: 'Outerwear', subcategory: 'Jackets' };
  }
  if (urlLower.includes('blazer') || nameLower.includes('blazer')) {
    return { category: 'Outerwear', subcategory: 'Blazers' };
  }
  if (urlLower.includes('trouser') || urlLower.includes('pant') || nameLower.includes('trouser') || nameLower.includes('pant')) {
    return { category: 'Bottoms', subcategory: 'Trousers' };
  }
  if (urlLower.includes('jean') || nameLower.includes('jean')) {
    return { category: 'Bottoms', subcategory: 'Jeans' };
  }
  if (urlLower.includes('sweater') || urlLower.includes('jumper') || nameLower.includes('sweater') || nameLower.includes('jumper')) {
    return { category: 'Tops', subcategory: 'Sweaters' };
  }
  if (urlLower.includes('dress') || nameLower.includes('dress')) {
    return { category: 'Dresses', subcategory: 'Midi' };
  }
  
  return { category: 'Tops', subcategory: 'Other' };
}

// Helper function to infer formality from product details
function inferFormality(category: string, name: string): 'casual' | 'smart-casual' | 'business' | 'formal' {
  const nameLower = name.toLowerCase();
  const catLower = category.toLowerCase();
  
  if (nameLower.includes('formal') || nameLower.includes('suit') || catLower.includes('formal')) {
    return 'formal';
  }
  if (nameLower.includes('business') || nameLower.includes('work') || nameLower.includes('office') || 
      catLower.includes('shirt') || catLower.includes('trouser') || catLower.includes('blazer')) {
    return 'business';
  }
  if (nameLower.includes('casual') || catLower.includes('jean') || catLower.includes('jacket')) {
    return 'casual';
  }
  
  return 'smart-casual';
}

// Helper function to infer weather suitability
function inferWeatherSuitability(category: string, name: string): { minTemp: number; maxTemp: number; conditions: string[] } {
  const nameLower = name.toLowerCase();
  const catLower = category.toLowerCase();
  
  if (catLower.includes('sweater') || catLower.includes('jumper') || nameLower.includes('wool') || nameLower.includes('knit')) {
    return { minTemp: 0, maxTemp: 20, conditions: ['cloudy', 'rainy'] };
  }
  if (catLower.includes('jacket') || catLower.includes('blazer')) {
    return { minTemp: 10, maxTemp: 25, conditions: ['sunny', 'partly-cloudy', 'cloudy'] };
  }
  if (catLower.includes('dress') || catLower.includes('shirt')) {
    return { minTemp: 15, maxTemp: 30, conditions: ['sunny', 'partly-cloudy'] };
  }
  
  return { minTemp: 10, maxTemp: 30, conditions: ['sunny', 'partly-cloudy', 'cloudy'] };
}

// Scrape Country Road products
async function scrapeCountryRoadProducts(categoryFilter?: string): Promise<CountryRoadItem[]> {
  const items: CountryRoadItem[] = [];
  const baseUrl = 'https://www.countryroad.com.au';
  
  // Category URLs to scrape
  const categoryUrls = [
    { url: '/women/clothing/tops', category: 'Tops' },
    { url: '/women/clothing/dresses', category: 'Dresses' },
    { url: '/women/clothing/outerwear', category: 'Outerwear' },
    { url: '/women/clothing/bottoms', category: 'Bottoms' },
    { url: '/men/clothing/tops', category: 'Tops' },
    { url: '/men/clothing/outerwear', category: 'Outerwear' },
    { url: '/men/clothing/bottoms', category: 'Bottoms' },
  ];
  
  try {
    for (const { url, category } of categoryUrls) {
      // Skip if category filter doesn't match
      if (categoryFilter && category.toLowerCase() !== categoryFilter.toLowerCase()) {
        continue;
      }
      
      try {
        const fullUrl = `${baseUrl}${url}`;
        console.log(`Scraping: ${fullUrl}`);
        
        const response = await axios.get(fullUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
          timeout: 10000,
        });
        
        const $ = cheerio.load(response.data);
        
        // Try multiple selectors for product cards (Country Road may use different structures)
        const productSelectors = [
          'article[data-testid="product-card"]',
          '.product-tile',
          '.product-card',
          '[data-product-id]',
          '.product-item',
          'a[href*="/products/"]',
        ];
        
        let productElements: cheerio.Cheerio<cheerio.Element> | null = null;
        
        for (const selector of productSelectors) {
          const elements = $(selector);
          if (elements.length > 0) {
            productElements = elements;
            console.log(`Found ${elements.length} products using selector: ${selector}`);
            break;
          }
        }
        
        if (!productElements || productElements.length === 0) {
          console.log(`No products found on ${fullUrl}, trying alternative approach...`);
          
          // Try to find product links directly
          const productLinks = $('a[href*="/products/"]');
          if (productLinks.length > 0) {
            productElements = productLinks;
            console.log(`Found ${productLinks.length} product links`);
          }
        }
        
        if (productElements && productElements.length > 0) {
          productElements.each((index, element) => {
            try {
              const $el = $(element);
              
              // Extract product URL
              const productUrl = $el.attr('href') || $el.find('a').attr('href') || '';
              if (!productUrl) return;
              
              const fullProductUrl = productUrl.startsWith('http') 
                ? productUrl 
                : `${baseUrl}${productUrl.startsWith('/') ? productUrl : '/' + productUrl}`;
              
              // Extract product name
              const name = $el.find('[data-testid="product-name"]').text().trim() ||
                          $el.find('.product-name').text().trim() ||
                          $el.find('h2').text().trim() ||
                          $el.find('h3').text().trim() ||
                          $el.attr('title') ||
                          $el.text().trim().split('\n')[0] ||
                          'Unknown Product';
              
              if (!name || name === 'Unknown Product') return;
              
              // Extract price
              const priceText = $el.find('[data-testid="product-price"]').text().trim() ||
                               $el.find('.price').text().trim() ||
                               $el.find('.product-price').text().trim() ||
                               $el.text().match(/\$\d+\.?\d*/)?.[0] ||
                               '';
              
              const price = extractPrice(priceText);
              if (price === 0) return;
              
              // Extract image
              const image = $el.find('img').attr('src') ||
                           $el.find('img').attr('data-src') ||
                           $el.find('[data-testid="product-image"]').attr('src') ||
                           $el.find('img').attr('data-lazy-src') ||
                           '';
              
              const fullImageUrl = image.startsWith('http') 
                ? image 
                : image.startsWith('//') 
                  ? `https:${image}`
                  : image.startsWith('/')
                    ? `${baseUrl}${image}`
                    : image;
              
              // Extract color (if available)
              const color = $el.find('[data-color]').attr('data-color') ||
                           $el.find('.color').text().trim() ||
                           'Various';
              
              // Infer category and other details
              const { category: inferredCategory, subcategory } = inferCategory(fullProductUrl, name);
              const formality = inferFormality(inferredCategory, name);
              const weatherSuitability = inferWeatherSuitability(inferredCategory, name);
              
              // Generate ID from URL
              const id = `cr-${fullProductUrl.split('/').pop()?.replace(/[^a-z0-9]/gi, '-') || Date.now()}-${index}`;
              
              const item: CountryRoadItem = {
                id,
                name: name.substring(0, 200), // Limit length
                price,
                image: fullImageUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop',
                category: inferredCategory,
                subcategory,
                color,
                size: 'M', // Default size
                brand: 'Country Road',
                material: 'Unknown', // Would need to scrape product detail page
                description: name, // Use name as description, could scrape detail page for full description
                url: fullProductUrl,
                inStock: true, // Assume in stock, would need to check
                seasonality: ['spring', 'summer', 'autumn', 'winter'],
                formality,
                weatherSuitability,
              };
              
              items.push(item);
            } catch (err) {
              console.error(`Error parsing product element: ${err}`);
            }
          });
        }
        
        // Limit to prevent too many items
        if (items.length >= 50) {
          console.log(`Reached limit of 50 items, stopping scrape`);
          break;
        }
        
      } catch (err) {
        console.error(`Error scraping ${url}:`, err);
        // Continue with next category
      }
    }
    
    console.log(`Successfully scraped ${items.length} products from Country Road`);
    return items;
    
  } catch (error) {
    console.error('Error in scrapeCountryRoadProducts:', error);
    throw error;
  }
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
      items = await scrapeCountryRoadProducts(category);
      
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
