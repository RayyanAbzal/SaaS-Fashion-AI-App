require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const vision = require('@google-cloud/vision');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * SaaS Fashion AI App Backend
 *
 * To use OpenAI Vision for clothing analysis, set your OpenAI API key as an environment variable:
 *   export OPENAI_API_KEY=sk-...yourkey...
 * Or add it to your .env file if using dotenv.
 */

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://stylematev2.firebaseio.com"
  });
}

const db = admin.firestore();

// Use shopping_products as the single source of truth for all scraped products
const shoppingCollection = db.collection('shopping_products');

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

// Google Vision client setup
const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: path.join(__dirname, 'google-vision-key.json'),
});

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

// Add at the top, after imports
const CATEGORY_KEYWORDS = {
  tops: ['shirt', 't-shirt', 'tee', 'polo', 'knit', 'sweat', 'jumper', 'crew', 'henley', 'singlet', 'tank', 'top'],
  bottoms: ['pant', 'pants', 'jean', 'short', 'trouser', 'chino', 'track', 'jogger', 'suit'],
  shoes: ['shoe', 'sneaker', 'boot', 'loafer', 'slide', 'thong'],
  outerwear: ['jacket', 'coat', 'blazer', 'overshirt', 'duffle'],
  accessories: ['belt', 'bag', 'duffle', 'wallet', 'tie', 'sock', 'scarf', 'hat']
};

function classifyCategory(name, url, description = '') {
  const text = `${name} ${description} ${url}`.toLowerCase();
  // Priority order: tops before bottoms to avoid 'short' in 'Short Sleeve Shirt'
  const CATEGORY_REGEX = [
    { category: 'tops', regex: /\b(shirt|t-shirt|tee|polo|knit|sweat|jumper|crew|henley|singlet|tank|top)\b/ },
    { category: 'bottoms', regex: /\b(jogger pant|track pant|chino|trouser|pant|pants|jean|short|shorts|suit)\b/ }, // match both 'short' and 'shorts'
    { category: 'outerwear', regex: /\b(jacket|coat|blazer|overshirt|duffle)\b/ },
    { category: 'shoes', regex: /\b(shoe|sneaker|boot|loafer|slide|thong)\b/ },
    { category: 'accessories', regex: /\b(belt|bag|wallet|tie|sock|scarf|hat)\b/ },
  ];
  for (const { category, regex } of CATEGORY_REGEX) {
    if (regex.test(text)) {
      return category;
    }
  }
  // Log unknowns for review
  console.warn(`[CategoryClassifier] Unknown category for product:`, { name, url, description });
  return 'unknown';
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

// Utility: Download remote image and convert to base64
async function remoteImageToBase64(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch image');
    const buffer = await response.buffer();
    return buffer.toString('base64');
  } catch (error) {
    console.error('Error converting remote image to base64:', error.message);
    throw error;
  }
}

// Hybrid color extraction utility (no OpenAI Vision)
function getProductColor({ name, productUrl }) {
  let color = extractColorFromUrl(productUrl) || extractColor(name);
  if (!color || color === 'unknown' || color === 'neutral' || color === '') {
    color = 'unknown';
  }
  return color;
}

// Add at the top, after imports
const COUNTRY_ROAD_SUBCATEGORY_URLS = [
  'https://www.countryroad.co.nz/man-clothing-chinos/',
  'https://www.countryroad.co.nz/man-clothing-pants/',
  'https://www.countryroad.co.nz/man-clothing-denim-jeans/',
  'https://www.countryroad.co.nz/man-clothing-shorts/',
  'https://www.countryroad.co.nz/man-clothing-suits-tailoring/',
  'https://www.countryroad.co.nz/man-clothing-knitwear/',
  'https://www.countryroad.co.nz/man-clothing-t-shirts/',
  'https://www.countryroad.co.nz/man-clothing-polos/',
  'https://www.countryroad.co.nz/man-clothing-casual-shirts/',
  'https://www.countryroad.co.nz/man-clothing-business-shirts/',
  'https://www.countryroad.co.nz/man-clothing-jackets-coats/',
  'https://www.countryroad.co.nz/man-clothing-blazers/',
  'https://www.countryroad.co.nz/man-clothing-sweats/',
  'https://www.countryroad.co.nz/man-clothing-swimwear/',
];

// Scraping function for Glassons with pagination
async function scrapeGlassons() {
  try {
    console.log('Attempting to scrape Glassons with pagination...');
    
    const allProducts = [];
    let page = 1;
    let hasMorePages = true;
    const maxPages = 10; // Safety limit to prevent infinite loops
    
    while (hasMorePages && page <= maxPages) {
      const url = page === 1 
        ? 'https://www.glassons.com/c/clothing'
        : `https://www.glassons.com/c/clothing?page=${page}`;
      
      console.log(`Scraping Glassons page ${page}: ${url}`);
      
      try {
        const response = await axios.get(url, {
          headers: HEADERS,
          timeout: 20000
        });
        
        const $ = cheerio.load(response.data);
        const products = [];
        
        // Try multiple selectors for Glassons
        const productSelectors = [
          '.product-item',
          '.product-card',
          '[data-product]',
          '.product',
          '.item',
          '[class*="product"]',
          '.product-grid-item',
          '.product-list-item'
        ];
        
        console.log(`Trying selectors for Glassons page ${page}...`);
        
        for (const selector of productSelectors) {
          const elements = $(selector);
          console.log(`Selector "${selector}" found ${elements.length} elements on page ${page}`);
          
          if (elements.length > 0) {
            const elementArray = elements.toArray();
            for (let idx = 0; idx < elementArray.length; idx++) {
              const element = elementArray[idx];
              try {
                const $el = $(element);
                
                // Try multiple selectors for each field
                const nameSelectors = [
                  '.product-name',
                  '.product-title',
                  '.name',
                  'h3',
                  'h4',
                  '.title',
                  '[class*="name"]',
                  '[class*="title"]'
                ];
                
                const priceSelectors = [
                  '.price',
                  '.product-price',
                  '[data-price]',
                  '.cost',
                  '[class*="price"]'
                ];
                
                const imageSelectors = [
                  'img[src]',
                  'img[data-src]',
                  'img[data-lazy-src]',
                  'img[data-original]'
                ];
                
                const linkSelectors = [
                  'a[href]',
                  '.product-link'
                ];
                
                // Extract name
                let name = '';
                for (const nameSel of nameSelectors) {
                  const nameEl = $el.find(nameSel).first();
                  if (nameEl.length > 0) {
                    name = nameEl.text().trim();
                    if (name) break;
                  }
                }
                
                // Extract price
                let priceText = '';
                for (const priceSel of priceSelectors) {
                  const priceEl = $el.find(priceSel).first();
                  if (priceEl.length > 0) {
                    priceText = priceEl.text().trim();
                    if (priceText) break;
                  }
                }
                
                // Extract image
                let imageUrl = '';
                for (const imgSel of imageSelectors) {
                  const imgEl = $el.find(imgSel).first();
                  if (imgEl.length > 0) {
                    imageUrl = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('data-lazy-src') || imgEl.attr('data-original');
                    if (imageUrl) break;
                  }
                }
                
                // Extract product URL
                let productUrl = '';
                for (const linkSel of linkSelectors) {
                  const linkEl = $el.find(linkSel).first();
                  if (linkEl.length > 0) {
                    productUrl = linkEl.attr('href');
                    if (productUrl) break;
                  }
                }
                
                // Hybrid color extraction (no AI)
                const detectedColor = getProductColor({ name, productUrl: productUrl });
                
                // Debug logging
                if (name || priceText || imageUrl) {
                  console.log(`Found potential Glassons product on page ${page}:`, { 
                    name: name ? name.substring(0, 50) : 'No name', 
                    priceText, 
                    hasImage: !!imageUrl,
                    hasUrl: !!productUrl,
                    color: detectedColor
                  });
                }
                
                if (name && priceText) {
                  const price = cleanPrice(priceText);
                  const category = classifyCategory(name, productUrl || '', '');
                  
                  // Ensure URLs are absolute
                  const fullImageUrl = imageUrl && !imageUrl.startsWith('http') ? `https://www.glassons.com${imageUrl}` : imageUrl;
                  const fullProductUrl = productUrl && !productUrl.startsWith('http') ? `https://www.glassons.com${productUrl}` : productUrl;
                  
                  // Create a unique identifier based on name and color to prevent duplicates
                  const uniqueId = `glassons-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${detectedColor}`;
                  
                  products.push({
                    id: uniqueId,
                    name: name,
                    brand: 'Glassons',
                    price: price,
                    imageUrl: fullImageUrl || 'https://via.placeholder.com/300x400/CCCCCC/666666?text=Glassons+Product',
                    purchaseUrl: fullProductUrl || '#',
                    productUrl: fullProductUrl || '#',
                    category: category,
                    color: detectedColor,
                    description: `${name} from Glassons`,
                    materials: [],
                    tags: ['glassons', category],
                    retailer: { id: 'glassons', name: 'Glassons' },
                    scrapedAt: new Date().toISOString()
                  });
                }
              } catch (error) {
                console.warn('Error parsing Glassons product on page ${page}:', error.message);
              }
            }
            
            if (products.length > 0) {
              console.log(`Found ${products.length} products with selector "${selector}" on page ${page}`);
              break; // Found products with this selector
            }
          }
        }
        
        // Add products from this page to the total
        allProducts.push(...products);
        
        // Check if there are more pages by looking for pagination elements
        const nextPageElement = $('a[href*="page=' + (page + 1) + '"]');
        const paginationInfo = $('.pagination-info, .results-count').text();
        
        console.log(`Page ${page} pagination info:`, paginationInfo);
        console.log(`Next page element found:`, nextPageElement.length > 0);
        
        // If no products found or no next page link, stop pagination
        if (products.length === 0 || nextPageElement.length === 0) {
          hasMorePages = false;
          console.log(`Stopping pagination at page ${page} - no more products or pages`);
        } else {
          page++;
          // Add a small delay between requests to be respectful
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.warn(`Failed to scrape Glassons page ${page}:`, error.message);
        hasMorePages = false;
      }
    }
    
    console.log(`Scraped ${allProducts.length} total products from Glassons across ${page - 1} pages`);
    return allProducts;
  } catch (error) {
    console.error('Error scraping Glassons:', error.message);
    return [];
  }
}

// Scraping function for Country Road with all subcategories and pagination
async function scrapeCountryRoad() {
  try {
    console.log('Attempting to scrape Country Road with all subcategories and pagination...');
    const allProducts = [];
    for (const subcatUrl of COUNTRY_ROAD_SUBCATEGORY_URLS) {
      console.log(`=== Scraping subcategory: ${subcatUrl} ===`);
      for (let page = 1; page <= 7; page++) {
        const url = page === 1 ? subcatUrl : `${subcatUrl}?src=i&page=${page}`;
        console.log(`Scraping Country Road page ${page}: ${url}`);
        try {
          const response = await axios.get(url, {
            headers: HEADERS,
            timeout: 20000
          });
          const $ = cheerio.load(response.data);
          const products = [];
          const productSelectors = [
            'section[data-type="ProductCard"]',
            '[data-type="ProductCard"]',
            '.product-card',
            '.product-item'
          ];
          let foundAny = false;
          for (const selector of productSelectors) {
            const elements = $(selector);
            if (elements.length > 0) {
              foundAny = true;
              const elementArray = elements.toArray();
              for (let idx = 0; idx < elementArray.length; idx++) {
                const element = elementArray[idx];
                try {
                  const $el = $(element);
                  const nameElement = $el.find('h2 a[title]').first();
                  const name = nameElement.attr('title') || nameElement.text().trim();
                  const priceElement = $el.find('.price-display .value').first();
                  const priceText = priceElement.text().trim();
                  const imageElement = $el.find('img[src]').first();
                  let imageUrl = imageElement.attr('src');
                  if (imageUrl && !imageUrl.startsWith('http')) imageUrl = 'https://www.countryroad.co.nz' + imageUrl;
                  const linkElement = $el.find('h2 a[href]').first();
                  let productUrl = linkElement.attr('href');
                  if (productUrl && !productUrl.startsWith('http')) productUrl = 'https://www.countryroad.co.nz' + productUrl;
                  const color = getProductColor({ name, productUrl });
                  if (name && priceText && imageUrl && productUrl) {
                    const price = cleanPrice(priceText);
                    const category = classifyCategory(name, productUrl || '', '');
                    const uniqueId = crypto.createHash('md5').update(productUrl).digest('hex');
                    products.push({
                      id: uniqueId,
                      name: name,
                      brand: 'Country Road',
                      price: price,
                      imageUrl: imageUrl,
                      purchaseUrl: productUrl,
                      productUrl: productUrl,
                      category: category,
                      color: color,
                      description: `${name} from Country Road`,
                      materials: [],
                      tags: ['country-road', category],
                      retailer: { id: 'countryroad', name: 'Country Road' },
                      scrapedAt: new Date().toISOString()
                    });
                    console.log(`Country Road product: ${name} | ID: ${uniqueId} | URL: ${productUrl}`);
                  }
                } catch (error) {
                  console.warn('Error parsing Country Road product:', error.message);
                }
              }
              if (products.length > 0) {
                console.log(`Found ${products.length} products with selector "${selector}" on page ${page}`);
                break; // Use first selector that finds products
              }
            }
          }
          if (products.length > 0) {
            allProducts.push(...products);
          }
          if (!foundAny || products.length === 0) {
            console.log(`No more products or selectors found on page ${page} for ${subcatUrl}`);
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.warn(`Failed to scrape Country Road page ${page}:`, error.message);
          break;
        }
      }
    }
    console.log(`Scraped ${allProducts.length} total products from Country Road (all subcategories)`);
    const idSet = new Set();
    let duplicateCount = 0;
    for (const prod of allProducts) {
      if (idSet.has(prod.id)) {
        duplicateCount++;
        console.warn(`Duplicate ID detected: ${prod.id} (${prod.name})`);
      } else {
        idSet.add(prod.id);
      }
    }
    console.log(`Total unique products: ${idSet.size}, duplicates: ${duplicateCount}`);
    return allProducts;
  } catch (error) {
    console.error('Error scraping Country Road:', error.message);
    return [];
  }
}

// Helper function to extract color from URL
function extractColorFromUrl(url) {
  if (!url) return 'unknown';
  
  const colorPatterns = [
    /-(\w+)-(\d+)$/, // Matches patterns like "-navy-1234"
    /color[=_-](\w+)/i, // Matches color parameters
    /(\w+)-(\d+)$/ // Matches general patterns
  ];
  
  for (const pattern of colorPatterns) {
    const match = url.match(pattern);
    if (match) {
      const color = match[1] || match[2];
      if (color && color.length > 2 && color.length < 20) {
        return color.toLowerCase();
      }
    }
  }
  
  return 'unknown';
}

// New endpoint to trigger scraping and database update
app.post('/api/scrape-and-save', async (req, res) => {
  try {
    console.log('Scraping and saving triggered...');
    
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
    
    // Deduplicate products by ID
    const uniqueProductsMap = new Map();
    for (const product of allProducts) {
      uniqueProductsMap.set(product.id, product);
    }
    const uniqueProducts = Array.from(uniqueProductsMap.values());
    
    console.log(`Scraped ${allProducts.length} products, deduplicated to ${uniqueProducts.length} unique products.`);
    
    // Save to database
    const dbResult = await saveProductsToDatabase(uniqueProducts);
    
    // Clear old products (older than 30 days)
    const deletedCount = await clearOldProducts(30);
    
    console.log(`Scraping and saving completed: ${allProducts.length} scraped, ${dbResult.saved} saved, ${dbResult.skipped} skipped, ${deletedCount} old products deleted`);
    
    res.json({
      success: true,
      scraped: allProducts.length,
      saved: dbResult.saved,
      skipped: dbResult.skipped,
      deleted: deletedCount,
      message: 'Scraping and database update completed successfully'
    });
    
  } catch (error) {
    console.error('Error in scrape and save:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to scrape and save products',
      message: error.message
    });
  }
});

// Endpoint to get database statistics
app.get('/api/database-stats', async (req, res) => {
  try {
    const snapshot = await shoppingCollection.get();
    const totalProducts = snapshot.size;
    
    // Get products by retailer
    const countryRoadProducts = snapshot.docs.filter(doc => 
      doc.data().retailer?.id === 'countryroad'
    ).length;
    
    const glassonsProducts = snapshot.docs.filter(doc => 
      doc.data().retailer?.id === 'glassons'
    ).length;
    
    // Get recent products (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentSnapshot = await shoppingCollection
      .where('lastScraped', '>', yesterday.toISOString())
      .get();
    
    res.json({
      success: true,
      totalProducts,
      countryRoadProducts,
      glassonsProducts,
      recentProducts: recentSnapshot.size,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting database stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get database statistics'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Pinterest Board Analysis Endpoint
app.post('/api/pinterest-board-analyze', async (req, res) => {
  try {
    const { boardUrl } = req.body;
    if (!boardUrl) {
      return res.status(400).json({ success: false, error: 'Missing boardUrl in request body' });
    }

    // Extract username and boardname from the URL
    const match = boardUrl.match(/pinterest\.com\/(.+?)\/(.+?)\//);
    if (!match) {
      return res.status(400).json({ success: false, error: 'Invalid Pinterest board URL format' });
    }
    const username = match[1];
    const boardname = match[2];

    // Fetch the board page
    const boardPageUrl = `https://www.pinterest.com/${username}/${boardname}/`;
    const response = await axios.get(boardPageUrl, { headers: HEADERS });
    const $ = cheerio.load(response.data);

    // Find all image URLs (Pinterest uses img tags with src or srcset)
    let imageUrls = [];
    $('img').each((i, el) => {
      const src = $(el).attr('src');
      if (src && src.startsWith('https://i.pinimg.com/')) {
        imageUrls.push(src);
      }
      // Optionally, parse srcset for higher-res images
      const srcset = $(el).attr('srcset');
      if (srcset) {
        const urls = srcset.split(',').map(s => s.trim().split(' ')[0]);
        urls.forEach(url => {
          if (url.startsWith('https://i.pinimg.com/')) {
            imageUrls.push(url);
          }
        });
      }
    });

    // Filter out profile images and small avatar images
    imageUrls = imageUrls.filter(url =>
      !url.includes('/profile_images/') &&
      !url.includes('/user-defaults/') &&
      !url.includes('/avatars/') &&
      !url.match(/\/(75|60|140)x\1(_RS)?\//) // Exclude /75x75/, /60x60/, /140x140/ and _RS variants
    );

    // Deduplicate by keeping only the highest-resolution version for each base image
    const urlMap = {};
    imageUrls.forEach(url => {
      // Remove size and crop info to get a base key (e.g., /564x/ or /236x/)
      const baseKey = url.replace(/\/\d+x\d+(_RS)?\//, '/originals/').replace(/\/\d+x\//, '/originals/');
      if (!urlMap[baseKey] || url.length > urlMap[baseKey].length) {
        urlMap[baseKey] = url;
      }
    });
    const uniqueImageUrls = Object.values(urlMap);

    res.json({
      success: true,
      boardUrl: boardPageUrl,
      imageCount: uniqueImageUrls.length,
      images: uniqueImageUrls
    });
  } catch (error) {
    console.error('Error analyzing Pinterest board:', error.message);
    res.status(500).json({ success: false, error: 'Failed to analyze Pinterest board', message: error.message });
  }
});

// Analyze Images for Clothing Items (OpenAI Vision)
app.post('/api/analyze-images-for-clothing', async (req, res) => {
  try {
    const { images } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing or invalid images array' });
    }

    // For each image, call OpenAI Vision and collect results (array of clothing items per image)
    const results = await Promise.all(images.map(async (imageUrl) => {
      try {
        const analyses = await analyzeClothingImageOpenAI(imageUrl); // array
        return { imageUrl, analyses };
      } catch (error) {
        return { imageUrl, error: error.message, analyses: [] };
      }
    }));

    res.json({ success: true, results });
  } catch (error) {
    console.error('Error analyzing images for clothing:', error.message);
    res.status(500).json({ success: false, error: 'Failed to analyze images for clothing', message: error.message });
  }
});

// Find Similar Products for Clothing Items (SerpApi Google Shopping only, with region support)
app.post('/api/find-similar-products', async (req, res) => {
  try {
    const { items, region, gender } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing or invalid items array' });
    }

    const SERPAPI_KEY = process.env.SERPAPI_KEY;
    if (!SERPAPI_KEY) {
      return res.status(500).json({ success: false, error: 'SerpApi key not set in environment variables.' });
    }

    // Use region/country code for local shopping results (default to 'nz' for New Zealand)
    const gl = region || 'nz';

    // Limit to only the first 2 items for SerpApi usage
    const limitedItems = items.slice(0, 2);

    const results = await Promise.all(limitedItems.map(async (item) => {
      try {
        // Add gender to the query for more accurate results
        let query = item.description || `${item.category} ${item.color}`;
        if (gender === 'female') query += ' for women';
        if (gender === 'male') query += ' for men';
        const serpUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}&gl=${gl}`;
        const serpRes = await axios.get(serpUrl);
        let similarProducts = [];
        if (serpRes.data && serpRes.data.shopping_results) {
          similarProducts = serpRes.data.shopping_results.map((prod, idx) => ({
            id: prod.product_id || `serpapi-product-${idx}`,
            name: prod.title || 'Shopping Result',
            brand: prod.brand || '',
            price: prod.price || 0,
            imageUrl: prod.thumbnail || '',
            purchaseUrl: prod.link || '',
            category: item.category,
            color: item.color,
            description: prod.description || '',
          }));
        }
        return { item, similarProducts };
      } catch (error) {
        return { item, error: error.message, similarProducts: [] };
      }
    }));

    res.json({ success: true, results });
  } catch (error) {
    console.error('Error finding similar products:', error.message);
    res.status(500).json({ success: false, error: 'Failed to find similar products', message: error.message });
  }
});

// Backend: Analyze clothing image with OpenAI Vision
async function analyzeClothingImageOpenAI(imageUrl) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key is not set in environment variables.');

  const base64Image = await remoteImageToBase64(imageUrl);
  const dataUri = `data:image/jpeg;base64,${base64Image}`;

  const body = {
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze the provided image for a fashion app. Your primary goal is to identify ALL distinct clothing items or accessories present in the image (e.g., shirt, pants, dress, shoes, hat, bag, etc). For each item, provide a detailed analysis as a JSON object. If the image contains no recognizable clothing items, return an empty array [].\n\n**RESPONSE FORMAT:**\nReturn a JSON array. Each element should be an object with the following fields:\n{\n  "isValidClothing": true,\n  "category": "'tops', 'bottoms', 'shoes', 'accessories', or 'outerwear'",\n  "subcategory": "A specific subcategory, e.g., 't-shirt', 'jeans', 'sneakers', 'handbag'",\n  "color": "The dominant color of the item",\n  "style": "A few descriptive keywords (e.g., 'vintage, casual, graphic-tee')",\n  "brand": "Identify the brand from the logo if clearly visible, otherwise use 'unknown'",\n  "season": "Suggest the best season(s): 'Summer', 'Winter', 'Autumn', 'Spring', or 'All-Season'",\n  "tags": ["Provide 5-7 relevant tags for searching, like 'denim', 'high-waisted', 'streetwear', '90s-fashion'"],\n  "description": "A brief, one-sentence description for the user's wardrobe.",\n  "confidence": "A score from 0.0 to 1.0 on your confidence in this analysis."\n}\nIf the image contains no valid clothing items, return [].\n\n**IMPORTANT CONTEXT:**\n- Audience: Gen Z in New Zealand.\n- Local Brands: Be aware of NZ brands like Hallensteins, Glassons, ASOS, Karen Walker, Zambesi, World, Icebreaker, Kathmandu, alongside global brands like Nike, Adidas, and Zara.\n- Segmentation Focus: Each object should focus only on a single clothing item, not the person or background.\n\n**EXAMPLE (MULTIPLE ITEMS):**\n- Input: Image of a person wearing a black leather jacket, blue jeans, and white sneakers.\n- Output: [\n  { ...leather jacket... },\n  { ...jeans... },\n  { ...sneakers... }\n]\n\nProceed with your analysis of the image provided.`
          },
          {
            type: 'image_url',
            image_url: { url: dataUri }
          }
        ]
      }
    ],
    max_tokens: 1000
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error('Invalid response from OpenAI API - no content found');

  // Parse JSON from content (may be markdown-wrapped)
  let analysisArr;
  let jsonContent = content.trim();
  if (jsonContent.startsWith('```json')) {
    jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (jsonContent.startsWith('```')) {
    jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  try {
    analysisArr = JSON.parse(jsonContent);
  } catch (err) {
    throw new Error('Failed to parse OpenAI response as JSON: ' + err.message);
  }
  // Always return an array
  if (!Array.isArray(analysisArr)) return [];
  return analysisArr;
}

// Database functions for shopping products
async function saveProductsToDatabase(products) {
  if (!products || products.length === 0) {
    console.log('No products to save to database');
    return { saved: 0, skipped: 0 };
  }

  console.log(`Saving ${products.length} products to database...`);

  // Firestore batch limit is 50
  const BATCH_LIMIT = 50;
  let savedCount = 0;
  let skippedCount = 0;
  let batchNum = 0;

  for (let i = 0; i < products.length; i += BATCH_LIMIT) {
    batchNum++;
    const batchProducts = products.slice(i, i + BATCH_LIMIT);
    const batch = db.batch();
    console.log(`[Batch ${batchNum}] Processing ${batchProducts.length} products...`);
    for (const product of batchProducts) {
      try {
        batch.set(shoppingCollection.doc(product.id), {
          ...product,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastScraped: new Date().toISOString()
        }, { merge: true });
        savedCount++;
        console.log(`[Batch ${batchNum}][SET] ${product.name} | color: ${product.color}`);
      } catch (error) {
        console.error(`[Batch ${batchNum}] Error processing product ${product.id}:`, error);
        skippedCount++;
      }
    }
    try {
      await batch.commit();
      console.log(`[Batch ${batchNum}] Batch commit successful: ${batchProducts.length} products`);
    } catch (error) {
      console.error(`[Batch ${batchNum}] Error committing batch to database:`, error);
      skippedCount += batchProducts.length;
    }
  }

  console.log(`Database operation completed: ${savedCount} saved/updated, ${skippedCount} skipped`);
  return { saved: savedCount, skipped: skippedCount };
}

async function getProductsFromDatabase(limit = 100) {
  try {
    const snapshot = await shoppingCollection
      .orderBy('lastScraped', 'desc')
      .limit(limit)
      .get();
    
    const products = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`Retrieved ${products.length} products from database`);
    return products;
  } catch (error) {
    console.error('Error retrieving products from database:', error);
    return [];
  }
}

async function clearOldProducts(daysOld = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const snapshot = await shoppingCollection
      .where('lastScraped', '<', cutoffDate.toISOString())
      .get();
    
    const batch = db.batch();
    let deletedCount = 0;
    
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
      deletedCount++;
    });
    
    if (deletedCount > 0) {
      await batch.commit();
      console.log(`Deleted ${deletedCount} old products from database`);
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Error clearing old products:', error);
    return 0;
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
});

const upload = multer({ dest: 'uploads/' });

// Audio transcription endpoint
app.post('/api/transcribe-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No audio file uploaded' });
    }
    const audioPath = req.file.path;
    const audioStream = fs.createReadStream(audioPath);
    const response = await openai.audio.transcriptions.create({
      file: audioStream,
      model: 'whisper-1',
      response_format: 'json',
      temperature: 0.2,
      language: 'en'
    });
    fs.unlink(audioPath, () => {}); // Clean up temp file
    if (response && response.text) {
      return res.json({ success: true, transcript: response.text });
    } else {
      return res.status(500).json({ success: false, error: 'No transcript returned' });
    }
  } catch (error) {
    console.error('Transcription error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Add new endpoint for retailer products
app.get('/api/retailer-feed', async (req, res) => {
  try {
    const { category, color } = req.query;
    let query = shoppingCollection;
    if (category) query = query.where('category', '==', category);
    if (color) query = query.where('color', '==', color);
    const snapshot = await query.limit(30).get();
    const products = snapshot.docs.map(doc => doc.data());
    res.json({ success: true, products });
  } catch (error) {
    console.error('Error fetching retailer products:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch retailer products' });
  }
});

// NOTE: Run the Python scraper on a schedule (e.g., daily) to keep Firestore up to date with Country Road products. 