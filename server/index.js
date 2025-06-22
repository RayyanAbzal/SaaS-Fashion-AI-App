const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Headers to mimic a real browser
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
};

// Mock data for fallback when scraping fails
const MOCK_SHOPPING_DATA = [
  {
    id: 'mock-1',
    name: 'Classic White T-Shirt',
    brand: 'Basic Brand',
    price: 25,
    imageUrl: 'https://via.placeholder.com/300x400/FFFFFF/000000?text=White+T-Shirt',
    purchaseUrl: 'https://example.com/product1',
    productUrl: 'https://example.com/product1',
    category: 'tops',
    color: 'white',
    description: 'A comfortable and versatile white t-shirt'
  },
  {
    id: 'mock-2',
    name: 'Blue Denim Jeans',
    brand: 'Denim Co',
    price: 80,
    imageUrl: 'https://via.placeholder.com/300x400/0000FF/FFFFFF?text=Blue+Jeans',
    purchaseUrl: 'https://example.com/product2',
    productUrl: 'https://example.com/product2',
    category: 'bottoms',
    color: 'blue',
    description: 'Classic blue denim jeans'
  },
  {
    id: 'mock-3',
    name: 'Black Sneakers',
    brand: 'Shoe Brand',
    price: 120,
    imageUrl: 'https://via.placeholder.com/300x400/000000/FFFFFF?text=Black+Sneakers',
    purchaseUrl: 'https://example.com/product3',
    productUrl: 'https://example.com/product3',
    category: 'shoes',
    color: 'black',
    description: 'Comfortable black sneakers'
  },
  {
    id: 'mock-4',
    name: 'Gray Hoodie',
    brand: 'Casual Wear',
    price: 45,
    imageUrl: 'https://via.placeholder.com/300x400/808080/FFFFFF?text=Gray+Hoodie',
    purchaseUrl: 'https://example.com/product4',
    productUrl: 'https://example.com/product4',
    category: 'tops',
    color: 'gray',
    description: 'Warm and cozy gray hoodie'
  },
  {
    id: 'mock-5',
    name: 'Brown Leather Jacket',
    brand: 'Leather Co',
    price: 200,
    imageUrl: 'https://via.placeholder.com/300x400/8B4513/FFFFFF?text=Leather+Jacket',
    purchaseUrl: 'https://example.com/product5',
    productUrl: 'https://example.com/product5',
    category: 'outerwear',
    color: 'brown',
    description: 'Stylish brown leather jacket'
  }
];

// Helper function to clean price
function cleanPrice(priceStr) {
  if (!priceStr) return 0;
  try {
    return parseFloat(priceStr.replace(/[^0-9.]/g, ''));
  } catch (error) {
    console.warn('Invalid price format:', priceStr);
    return 0;
  }
}

// Helper function to classify category
function classifyCategory(name, url) {
  const nameLower = name.toLowerCase();
  const urlLower = url.toLowerCase();
  
  if (nameLower.includes('shirt') || nameLower.includes('top') || nameLower.includes('t-shirt') || urlLower.includes('tops')) {
    return 'tops';
  }
  if (nameLower.includes('pant') || nameLower.includes('jean') || nameLower.includes('short') || urlLower.includes('bottoms')) {
    return 'bottoms';
  }
  if (nameLower.includes('shoe') || nameLower.includes('sneaker') || nameLower.includes('boot') || urlLower.includes('shoes')) {
    return 'shoes';
  }
  if (nameLower.includes('jacket') || nameLower.includes('coat') || nameLower.includes('blazer') || urlLower.includes('outerwear')) {
    return 'outerwear';
  }
  if (nameLower.includes('hat') || nameLower.includes('bag') || nameLower.includes('accessory') || urlLower.includes('accessories')) {
    return 'accessories';
  }
  
  return 'tops'; // default
}

// Helper function to extract color from name
function extractColor(name) {
  const nameLower = name.toLowerCase();
  const colors = ['black', 'white', 'blue', 'red', 'green', 'yellow', 'purple', 'pink', 'orange', 'brown', 'gray', 'grey', 'navy', 'beige', 'cream'];
  
  for (const color of colors) {
    if (nameLower.includes(color)) {
      return color;
    }
  }
  
  return 'neutral';
}

// Scraping function for Glassons
async function scrapeGlassons() {
  try {
    console.log('Attempting to scrape Glassons...');
    
    // Try multiple URLs in case one fails - using correct URLs from user
    const urls = [
      'https://www.glassons.com/c/clothing',
      'https://www.glassons.com/c/clothing/tops',
      'https://www.glassons.com/c/clothing/bottoms'
    ];
    
    let response;
    let success = false;
    
    for (const url of urls) {
      try {
        response = await axios.get(url, {
          headers: HEADERS,
          timeout: 10000
        });
        success = true;
        console.log(`Successfully scraped ${url}`);
        break;
      } catch (error) {
        console.warn(`Failed to scrape ${url}:`, error.message);
        continue;
      }
    }
    
    if (!success) {
      console.log('All Glassons URLs failed, using mock data');
      return [];
    }
    
    const $ = cheerio.load(response.data);
    const products = [];
    
    // Based on the search results, Glassons uses a different structure
    // Look for product elements with more specific selectors
    $('[data-testid*="product"], .product-card, .product-item, .product, [class*="product"]').each((index, element) => {
      try {
        const $el = $(element);
        
        // Extract product information with multiple selectors
        const name = $el.find('[data-testid*="name"], .product-name, .product-title, .name, h3, h4, .title, [class*="name"]').first().text().trim();
        const priceText = $el.find('[data-testid*="price"], .price, .product-price, [data-price], .cost, [class*="price"]').first().text().trim();
        const imageUrl = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src') || $el.find('img').first().attr('data-lazy-src');
        const productUrl = $el.find('a').first().attr('href');
        
        if (name && priceText) {
          const price = cleanPrice(priceText);
          const category = classifyCategory(name, productUrl || '');
          const color = extractColor(name);
          
          // Ensure URLs are absolute
          const fullImageUrl = imageUrl && !imageUrl.startsWith('http') ? `https://www.glassons.com${imageUrl}` : imageUrl;
          const fullProductUrl = productUrl && !productUrl.startsWith('http') ? `https://www.glassons.com${productUrl}` : productUrl;
          
          products.push({
            id: `glassons-${index}`,
            name: name,
            brand: 'Glassons',
            price: price,
            imageUrl: fullImageUrl || 'https://via.placeholder.com/300x400/CCCCCC/666666?text=No+Image',
            purchaseUrl: fullProductUrl || '#',
            productUrl: fullProductUrl || '#',
            category: category,
            color: color,
            description: `${name} from Glassons`
          });
        }
      } catch (error) {
        console.warn('Error parsing product:', error.message);
      }
    });
    
    console.log(`Scraped ${products.length} products from Glassons`);
    return products;
  } catch (error) {
    console.error('Error scraping Glassons:', error.message);
    return [];
  }
}

// Scraping function for Country Road
async function scrapeCountryRoad() {
  try {
    console.log('Attempting to scrape Country Road...');
    
    // Try multiple URLs in case one fails - using correct URLs from user
    const urls = [
      'https://www.countryroad.co.nz/man-new-in/',
      'https://www.countryroad.co.nz/man-clothing/',
      'https://www.countryroad.co.nz/woman-new-in/',
      'https://www.countryroad.co.nz/woman-clothing/'
    ];
    
    let response;
    let success = false;
    
    for (const url of urls) {
      try {
        response = await axios.get(url, {
          headers: HEADERS,
          timeout: 10000
        });
        success = true;
        console.log(`Successfully scraped ${url}`);
        break;
      } catch (error) {
        console.warn(`Failed to scrape ${url}:`, error.message);
        continue;
      }
    }
    
    if (!success) {
      console.log('All Country Road URLs failed, using mock data');
      return [];
    }
    
    const $ = cheerio.load(response.data);
    const products = [];
    
    // Based on the search results, Country Road has specific product structure
    // Look for product elements with more specific selectors
    $('[data-testid*="product"], .product-card, .product-item, .product, [class*="product"], .product-grid-item').each((index, element) => {
      try {
        const $el = $(element);
        
        // Extract product information with multiple selectors
        const name = $el.find('[data-testid*="name"], .product-name, .product-title, .name, h3, h4, .title, [class*="name"]').first().text().trim();
        const priceText = $el.find('[data-testid*="price"], .price, .product-price, [data-price], .cost, [class*="price"]').first().text().trim();
        const imageUrl = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src') || $el.find('img').first().attr('data-lazy-src');
        const productUrl = $el.find('a').first().attr('href');
        
        if (name && priceText) {
          const price = cleanPrice(priceText);
          const category = classifyCategory(name, productUrl || '');
          const color = extractColor(name);
          
          // Ensure URLs are absolute
          const fullImageUrl = imageUrl && !imageUrl.startsWith('http') ? `https://www.countryroad.co.nz${imageUrl}` : imageUrl;
          const fullProductUrl = productUrl && !productUrl.startsWith('http') ? `https://www.countryroad.co.nz${productUrl}` : productUrl;
          
          products.push({
            id: `countryroad-${index}`,
            name: name,
            brand: 'Country Road',
            price: price,
            imageUrl: fullImageUrl || 'https://via.placeholder.com/300x400/CCCCCC/666666?text=No+Image',
            purchaseUrl: fullProductUrl || '#',
            productUrl: fullProductUrl || '#',
            category: category,
            color: color,
            description: `${name} from Country Road`
          });
        }
      } catch (error) {
        console.warn('Error parsing product:', error.message);
      }
    });
    
    console.log(`Scraped ${products.length} products from Country Road`);
    return products;
  } catch (error) {
    console.error('Error scraping Country Road:', error.message);
    return [];
  }
}

// Shopping feed endpoint
app.get('/api/shopping-feed', async (req, res) => {
    try {
    console.log('Shopping feed requested');
    
    // Try to scrape from multiple sources
    const [glassonsProducts, countryRoadProducts] = await Promise.allSettled([
      scrapeGlassons(),
      scrapeCountryRoad()
    ]);
    
    let allProducts = [];
    
    // Add successful scrapes
    if (glassonsProducts.status === 'fulfilled' && glassonsProducts.value.length > 0) {
      allProducts = allProducts.concat(glassonsProducts.value);
    }
    
    if (countryRoadProducts.status === 'fulfilled' && countryRoadProducts.value.length > 0) {
      allProducts = allProducts.concat(countryRoadProducts.value);
    }
    
    // If no products were scraped, use mock data
    if (allProducts.length === 0) {
      console.log('No products scraped, using mock data');
      allProducts = MOCK_SHOPPING_DATA;
    }
    
    // Limit to 20 products to avoid overwhelming the app
    const limitedProducts = allProducts.slice(0, 20);
    
    console.log(`Returning ${limitedProducts.length} products`);
    res.json(limitedProducts);
    
  } catch (error) {
    console.error('Error in shopping feed:', error);
    // Return mock data as fallback
    res.json(MOCK_SHOPPING_DATA);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Shopping feed available at: http://localhost:${PORT}/api/shopping-feed`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
}); 