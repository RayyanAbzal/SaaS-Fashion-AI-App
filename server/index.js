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
let db;
try {
  console.log('🔥 Initializing Firebase...');
if (!admin.apps.length) {
    const serviceAccount = require('./stylematev2-firebase-adminsdk-fbsvc-385a67ccdb.json');
    
  admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://stylematev2.firebaseio.com"
  });
    console.log('✅ Firebase initialized successfully');
  }
  db = admin.firestore();
  console.log('✅ Firestore connected');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  console.log('⚠️ Server will continue without Firebase (some features may not work)');
  db = null;
}
const shoppingCollection = db ? db.collection('shopping_products') : null;

// Initialize Google Vision API client (optional)
let visionClient = null;
try {
  visionClient = new vision.ImageAnnotatorClient({
    // Use default credentials or set GOOGLE_APPLICATION_CREDENTIALS env var
  });
  console.log('✅ Google Vision API initialized successfully');
} catch (error) {
  console.log('⚠️ Google Vision API not available, using fallback analysis');
  console.log('To enable Google Vision, set GOOGLE_APPLICATION_CREDENTIALS environment variable');
}

// Optional image processing lib (for skin tone estimation)
let Jimp = null;
try {
  // eslint-disable-next-line global-require
  Jimp = require('jimp');
} catch (e) {
  Jimp = null;
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Headers to mimic a real browser
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
};

// Google Vision client setup (will be initialized later)

// Category classification configuration
const CATEGORY_REGEX = [
  { category: 'tops', regex: /\b(shirt|t-shirt|tee|polo|knit|sweat|jumper|crew|henley|singlet|tank|top)\b/ },
  { category: 'bottoms', regex: /\b(jogger pant|track pant|chino|trouser|pant|pants|jean|short|shorts|suit)\b/ },
  { category: 'outerwear', regex: /\b(jacket|coat|blazer|overshirt|duffle)\b/ },
  { category: 'shoes', regex: /\b(shoe|sneaker|boot|loafer|slide|thong)\b/ },
  { category: 'accessories', regex: /\b(belt|bag|wallet|tie|sock|scarf|hat)\b/ },
];

// Color extraction configuration
const COLORS = ['black', 'white', 'blue', 'red', 'green', 'yellow', 'purple', 'pink', 'orange', 'brown', 'gray', 'grey', 'navy', 'beige', 'cream'];

// Country Road subcategory URLs
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

// Utility functions
const cleanPrice = (priceStr) => {
  if (!priceStr) return 0;
  try {
    return parseFloat(priceStr.replace(/[^0-9.]/g, ''));
  } catch (error) {
    console.warn('Invalid price format:', priceStr);
    return 0;
  }
};

const classifyCategory = (name, url, description = '') => {
  const text = `${name} ${description} ${url}`.toLowerCase();
  for (const { category, regex } of CATEGORY_REGEX) {
    if (regex.test(text)) {
      return category;
    }
  }
  console.warn(`[CategoryClassifier] Unknown category for product:`, { name, url, description });
  return 'unknown';
};

const extractColor = (name) => {
  const nameLower = name.toLowerCase();
  for (const color of COLORS) {
    if (nameLower.includes(color)) {
      return color;
    }
  }
  return 'neutral';
};

const extractColorFromUrl = (url) => {
  if (!url) return 'unknown';
  
  const colorPatterns = [
    /-(\w+)-(\d+)$/,
    /color[=_-](\w+)/i,
    /(\w+)-(\d+)$/
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
};

const getProductColor = ({ name, productUrl }) => {
  let color = extractColorFromUrl(productUrl) || extractColor(name);
  if (!color || color === 'unknown' || color === 'neutral' || color === '') {
    color = 'unknown';
  }
  return color;
};

const remoteImageToBase64 = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch image');
    const buffer = await response.buffer();
    return buffer.toString('base64');
  } catch (error) {
    console.error('Error converting remote image to base64:', error.message);
    throw error;
  }
};

// Generic scraping function
const scrapeProducts = async (config) => {
  const { baseUrl, brand, selectors, maxPages = 10, delay = 1000 } = config;
    const allProducts = [];
    let page = 1;
    let hasMorePages = true;
    
    while (hasMorePages && page <= maxPages) {
    const url = page === 1 ? baseUrl : `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}page=${page}`;
    
    try {
      const response = await axios.get(url, { headers: HEADERS, timeout: 20000 });
        const $ = cheerio.load(response.data);
        const products = [];
        
      for (const selector of selectors) {
          const elements = $(selector);
          if (elements.length > 0) {
          for (const element of elements.toArray()) {
              try {
                const $el = $(element);
              const product = config.extractProduct($el, $);
              if (product) {
                products.push(product);
              }
            } catch (error) {
              console.warn(`Error parsing ${brand} product:`, error.message);
            }
          }
          if (products.length > 0) break;
        }
      }

      allProducts.push(...products);
      
      const nextPageElement = $(`a[href*="page=${page + 1}"]`);
      if (products.length === 0 || nextPageElement.length === 0) {
        hasMorePages = false;
      } else {
        page++;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.warn(`Failed to scrape ${brand} page ${page}:`, error.message);
      hasMorePages = false;
    }
  }

  return allProducts;
};

// Glassons scraping configuration
const glassonsConfig = {
  baseUrl: 'https://www.glassons.com/c/clothing',
  brand: 'Glassons',
  selectors: ['.product-item', '.product-card', '[data-product]', '.product', '.item', '[class*="product"]'],
  extractProduct: ($el, $) => {
    const nameSelectors = ['.product-name', '.product-title', '.name', 'h3', 'h4', '.title'];
    const priceSelectors = ['.price', '.product-price', '[data-price]', '.cost'];
    const imageSelectors = ['img[src]', 'img[data-src]', 'img[data-lazy-src]', 'img[data-original]'];
    const linkSelectors = ['a[href]', '.product-link'];

                let name = '';
    for (const sel of nameSelectors) {
      const el = $el.find(sel).first();
      if (el.length > 0) {
        name = el.text().trim();
                    if (name) break;
                  }
                }
                
                let priceText = '';
    for (const sel of priceSelectors) {
      const el = $el.find(sel).first();
      if (el.length > 0) {
        priceText = el.text().trim();
                    if (priceText) break;
                  }
                }
                
                let imageUrl = '';
    for (const sel of imageSelectors) {
      const el = $el.find(sel).first();
      if (el.length > 0) {
        imageUrl = el.attr('src') || el.attr('data-src') || el.attr('data-lazy-src') || el.attr('data-original');
                    if (imageUrl) break;
                  }
                }
                
                let productUrl = '';
    for (const sel of linkSelectors) {
      const el = $el.find(sel).first();
      if (el.length > 0) {
        productUrl = el.attr('href');
                    if (productUrl) break;
                  }
                }
                
                if (name && priceText) {
                  const price = cleanPrice(priceText);
                  const category = classifyCategory(name, productUrl || '', '');
      const color = getProductColor({ name, productUrl });
      const uniqueId = `glassons-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${color}`;
                  
                  const fullImageUrl = imageUrl && !imageUrl.startsWith('http') ? `https://www.glassons.com${imageUrl}` : imageUrl;
                  const fullProductUrl = productUrl && !productUrl.startsWith('http') ? `https://www.glassons.com${productUrl}` : productUrl;
                  
      return {
                    id: uniqueId,
        name,
                    brand: 'Glassons',
        price,
                    imageUrl: fullImageUrl || 'https://via.placeholder.com/300x400/CCCCCC/666666?text=Glassons+Product',
                    purchaseUrl: fullProductUrl || '#',
                    productUrl: fullProductUrl || '#',
        category,
        color,
                    description: `${name} from Glassons`,
                    materials: [],
                    tags: ['glassons', category],
                    retailer: { id: 'glassons', name: 'Glassons' },
                    scrapedAt: new Date().toISOString()
      };
    }
    return null;
  }
};

// Country Road scraping configuration
const countryRoadConfig = {
  baseUrl: 'https://www.countryroad.co.nz/man-clothing-chinos/',
  brand: 'Country Road',
  selectors: ['section[data-type="ProductCard"]', '[data-type="ProductCard"]', '.product-card', '.product-item'],
  extractProduct: ($el, $) => {
                  const nameElement = $el.find('h2 a[title]').first();
                  const name = nameElement.attr('title') || nameElement.text().trim();
    
                  const priceElement = $el.find('.price-display .value').first();
                  const priceText = priceElement.text().trim();
    
                  const imageElement = $el.find('img[src]').first();
                  let imageUrl = imageElement.attr('src');
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = 'https://www.countryroad.co.nz' + imageUrl;
    }
    
                  const linkElement = $el.find('h2 a[href]').first();
                  let productUrl = linkElement.attr('href');
    if (productUrl && !productUrl.startsWith('http')) {
      productUrl = 'https://www.countryroad.co.nz' + productUrl;
    }

                  if (name && priceText && imageUrl && productUrl) {
                    const price = cleanPrice(priceText);
      const category = classifyCategory(name, productUrl, '');
      const color = getProductColor({ name, productUrl });
                    const uniqueId = crypto.createHash('md5').update(productUrl).digest('hex');

      return {
                      id: uniqueId,
        name,
                      brand: 'Country Road',
        price,
        imageUrl,
                      purchaseUrl: productUrl,
        productUrl,
        category,
        color,
                      description: `${name} from Country Road`,
                      materials: [],
                      tags: ['country-road', category],
                      retailer: { id: 'countryroad', name: 'Country Road' },
                      scrapedAt: new Date().toISOString()
      };
    }
    return null;
  }
};

// Scraping functions using the generic scraper
const scrapeGlassons = () => scrapeProducts(glassonsConfig);

const scrapeCountryRoad = async () => {
  const allProducts = [];
  for (const subcatUrl of COUNTRY_ROAD_SUBCATEGORY_URLS) {
    const config = { ...countryRoadConfig, baseUrl: subcatUrl };
    const products = await scrapeProducts(config);
            allProducts.push(...products);
          }
    return allProducts;
};

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

// Pinterest analysis endpoint with Google Vision API
app.post('/api/pinterest-analyze', async (req, res) => {
  try {
    const { pinterestUrl } = req.body;
    
    if (!pinterestUrl) {
      return res.status(400).json({ success: false, error: 'Pinterest URL is required' });
    }

    console.log('🔍 Processing Pinterest URL with Google Vision API:', pinterestUrl);

    // Extract image from Pinterest URL
    const imageUrl = await extractImageFromPinterestUrl(pinterestUrl);
    console.log('Extracted image URL:', imageUrl);

    // Analyze image with Google Vision API
    const fashionAnalysis = await analyzeFashionImage(imageUrl);
    console.log('🎨 Fashion analysis:', fashionAnalysis);

    // Generate similar items based on analysis
    const similarItems = generateItemsFromAnalysis(fashionAnalysis);
    
    const result = {
      queryImage: imageUrl,
      pinterestUrl: pinterestUrl,
      similarItems: similarItems,
      searchTime: 3.2,
      fashionAnalysis: fashionAnalysis
    };

    console.log('✅ Pinterest analysis complete:', result.similarItems.length, 'items found');
    res.json(result);

  } catch (error) {
    console.error('❌ Error processing Pinterest URL:', error);
    res.status(500).json({ 
      success: false, 
      error: `Failed to process Pinterest URL: ${error.message}` 
    });
  }
});

// Helper to compute style advice from a fashion analysis result
function computeStyleAdviceFromAnalysis(analysis, options = {}) {
  const { skinTone } = options; // optional, e.g., 'fair' | 'medium' | 'deep' | hex code
  const colors = analysis.colors || [];
  const clothingTypes = analysis.clothingTypes || [];
  const styles = analysis.styles || [];
  const detectedItems = analysis.detectedItems || [];

  const dominantColors = colors.slice(0, 3);
  const hasNeutralHarmony = colors.includes('white') || colors.includes('black') || colors.includes('beige') || colors.includes('gray') || colors.includes('grey');
  const colorHarmony = hasNeutralHarmony || colors.length <= 2 ? 'excellent' : (colors.length <= 3 ? 'good' : 'needs-improvement');

  let overallRatingOutOf10 = Math.min(10, Math.max(3, Math.round((analysis.confidence || 0.7) * 10 - (colorHarmony === 'needs-improvement' ? 2 : 0) + (colorHarmony === 'excellent' ? 1 : 0))));
  const overallRatingStars = Math.max(1, Math.min(5, Math.round(overallRatingOutOf10 / 2)));

  const suggestions = [];
  const compliments = [];

  // More descriptive and honest color analysis
  if (colorHarmony === 'excellent') {
    if (colors.includes('black') && colors.includes('white')) {
      compliments.push('Classic black and white combo - timeless and always works');
    } else if (hasNeutralHarmony) {
      compliments.push('Smart neutral palette - versatile and sophisticated');
    } else {
      compliments.push('Your colors work beautifully together');
    }
  } else if (colorHarmony === 'good') {
    compliments.push('Nice color choices - you have good instincts');
    if (colors.length > 2) {
      suggestions.push('Try limiting to 2-3 colors max. Right now you have a lot going on - pick your favorite color and build around it with neutrals');
    } else {
      suggestions.push('Add a crisp white or deep black piece to ground this look and make it more polished');
    }
  } else {
    suggestions.push('Honestly, this color combo is fighting itself. Pick ONE statement color and pair it with neutrals (black, white, navy, or beige). Less is more here');
  }

  // Specific styling advice based on detected items
  const hasTop = clothingTypes.some(item => ['shirt', 'blouse', 'top', 'sweater', 't-shirt'].includes(item.toLowerCase()));
  const hasBottom = clothingTypes.some(item => ['pants', 'jeans', 'shorts', 'skirt', 'trousers'].includes(item.toLowerCase()));
  const hasJacket = clothingTypes.some(item => ['jacket', 'blazer', 'coat', 'cardigan'].includes(item.toLowerCase()));

  if (hasJacket) {
    compliments.push('Love the layering - it adds structure and sophistication');
    if (overallRatingOutOf10 < 7) {
      suggestions.push('The jacket is doing the heavy lifting here. Make sure what\'s underneath is fitted and simple so the jacket can shine');
    }
  }

  if (hasTop && hasBottom) {
    if (overallRatingOutOf10 >= 7) {
      compliments.push('Good proportions - you understand how to balance your silhouette');
    } else {
      suggestions.push('Think about proportions: if your top is loose, go fitted on bottom (and vice versa). Right now the proportions feel off');
    }
  }

  // Fit and styling reality checks
  if (clothingTypes.includes('jeans')) {
    if (overallRatingOutOf10 >= 8) {
      compliments.push('Jeans styled right - they look intentional, not like an afterthought');
    } else {
      suggestions.push('Jeans can look amazing or sloppy - make sure they fit well and aren\'t too baggy or tight. The right jeans are worth the investment');
    }
  }

  if (clothingTypes.includes('dress')) {
    compliments.push('Dresses are effortless chic when done right');
    if (overallRatingOutOf10 < 7) {
      suggestions.push('The dress is nice but needs something - try a belt to define your waist, or a jacket/cardigan for structure');
    }
  }

  // Honest overall feedback
  let overallFeedback;
  if (overallRatingOutOf10 >= 8) {
    overallFeedback = 'This look works! You clearly know what you\'re doing. The colors, fit, and styling all come together nicely.';
  } else if (overallRatingOutOf10 >= 6) {
    overallFeedback = 'You\'re on the right track, but there\'s room to elevate this. Small tweaks can make a big difference.';
  } else {
    overallFeedback = 'Let\'s be honest - this outfit needs work. But that\'s totally fine! Everyone has off days. Focus on fit first, then colors.';
  }

  const styleType = styles[0] || 'casual';
  let occasions;
  if (overallRatingOutOf10 >= 8) {
    occasions = styleType.includes('formal') || hasJacket
      ? ['Work', 'Dinner Date', 'Important Meeting', 'Date Night']
      : ['Brunch', 'Coffee Date', 'Shopping', 'Casual Friday', 'Weekend Plans'];
  } else if (overallRatingOutOf10 >= 6) {
    occasions = ['Casual Errands', 'Quick Coffee', 'Grocery Run', 'Relaxed Hangout'];
  } else {
    occasions = ['Home', 'Quick Errands Only'];
  }

  // Skin tone compatibility with honest feedback
  let skinCompatibility = null;
  if (skinTone) {
    const warmColors = ['orange', 'yellow', 'red', 'brown', 'beige', 'cream'];
    const coolColors = ['blue', 'green', 'purple', 'gray', 'grey', 'black', 'white', 'navy'];
    
    const hasWarm = colors.some(c => warmColors.includes(c));
    const hasCool = colors.some(c => coolColors.includes(c));

    if (skinTone === 'fair') {
      if (colors.includes('beige') && !hasCool) {
        suggestions.push('The beige is washing you out. Fair skin needs contrast - try black, navy, or bright colors to make your skin glow');
        overallRatingOutOf10 = Math.max(3, overallRatingOutOf10 - 1);
        skinCompatibility = 'needs-improvement';
      } else if (hasCool || colors.includes('red') || colors.includes('pink')) {
        compliments.push('These colors are gorgeous on fair skin - they make you look radiant');
        skinCompatibility = 'excellent';
      } else {
        skinCompatibility = 'good';
      }
    } else if (skinTone === 'medium') {
      if (hasWarm && hasCool) {
        compliments.push('You can pull off both warm and cool tones - lucky you!');
        skinCompatibility = 'excellent';
      } else {
        skinCompatibility = 'good';
      }
    } else if (skinTone === 'deep') {
      if (colors.includes('navy') && !hasWarm) {
        suggestions.push('Navy can look flat on deeper skin. Try adding warm tones like gold, orange, or rich burgundy to make your skin tone pop');
        overallRatingOutOf10 = Math.max(4, overallRatingOutOf10 - 1);
        skinCompatibility = 'needs-improvement';
      } else if (hasWarm || colors.includes('white')) {
        compliments.push('These colors are stunning on your skin tone - they really make you glow');
        skinCompatibility = 'excellent';
      } else {
        skinCompatibility = 'good';
      }
    }
  }

  return {
    advice: {
      overallRating: overallRatingStars,
      overallRating10: overallRatingOutOf10,
      overallFeedback,
      suggestions,
      compliments,
      occasions,
      skinCompatibility,
      colorAnalysis: {
        dominantColors,
        colorHarmony,
        colorAdvice: colorHarmony === 'excellent'
          ? 'Your color game is strong - stick with what works'
          : (colorHarmony === 'good' 
            ? 'Good foundation, just needs one neutral to tie it together'
            : 'Too many competing colors - simplify your palette'),
      },
      fitAnalysis: {
        overallFit: overallRatingOutOf10 >= 7 ? 'good' : 'needs-work',
        fitAdvice: overallRatingOutOf10 >= 7 
          ? 'The fit works well - you know your proportions'
          : 'Focus on fit first - even expensive clothes look cheap if they don\'t fit right'
      },
      styleAnalysis: {
        styleType,
        confidence: Math.round((analysis.confidence || 0.7) * 100),
        styleAdvice: overallRatingOutOf10 >= 8 
          ? 'You\'ve got this! Maybe add one small accessory to complete the look'
          : (overallRatingOutOf10 >= 6
            ? 'You\'re close - one or two small changes will elevate this significantly'
            : 'Start with the basics: fit, then colors, then accessories. Build from there')
      }
    },
    analysis
  };
}

// Style check by image URL
app.post('/api/style-check-url', async (req, res) => {
  try {
    const { imageUrl, skinTone } = req.body || {};
    if (!imageUrl) {
      return res.status(400).json({ success: false, error: 'imageUrl is required' });
    }
    const analysis = await analyzeFashionImage(imageUrl);
    const payload = computeStyleAdviceFromAnalysis(analysis, { skinTone });
    return res.json({ success: true, ...payload });
  } catch (error) {
    console.error('Style check URL error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to analyze image' });
  }
});

// Style check by base64 image (from mobile camera/gallery)
app.post('/api/style-check-base64', async (req, res) => {
  try {
    const { imageBase64, skinTone } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'imageBase64 is required' });
    }

    if (!visionClient) {
      const analysis = getFallbackFashionAnalysis();
      const payload = computeStyleAdviceFromAnalysis(analysis, { skinTone });
      return res.json({ success: true, ...payload });
    }

    // Write temp file and analyze
    const tmpPath = path.join(__dirname, 'uploads', `style_${Date.now()}.jpg`);
    fs.writeFileSync(tmpPath, Buffer.from(imageBase64, 'base64'));
    try {
      const [labelResult] = await visionClient.labelDetection(tmpPath);
      const labels = labelResult.labelAnnotations || [];
      const [colorResult] = await visionClient.imageProperties(tmpPath);
      const colors = colorResult.imagePropertiesAnnotation?.dominantColors?.colors || [];
      const analysis = analyzeLabels(labels, colors);
      const payload = computeStyleAdviceFromAnalysis(analysis, { skinTone });
      return res.json({ success: true, ...payload });
    } finally {
      fs.unlink(tmpPath, () => {});
    }
  } catch (error) {
    console.error('Style check base64 error:', error.message);
    const fallback = computeStyleAdviceFromAnalysis(getFallbackFashionAnalysis(), { skinTone });
    return res.json({ success: true, ...fallback, note: 'Using fallback analysis' });
  }
});

// Helper function to extract image from Pinterest URL
async function extractImageFromPinterestUrl(pinterestUrl) {
  // For now, return a placeholder image
  // In production, you'd use Pinterest API or web scraping
  return 'https://via.placeholder.com/400x600/FF6B6B/FFFFFF?text=Pinterest+Image';
}

// Fallback fashion analysis when Google Vision is not available
function getFallbackFashionAnalysis() {
  return {
    clothingTypes: ['shirt', 'dress', 'top'],
    colors: ['white', 'black', 'blue'],
    patterns: ['solid', 'striped'],
    styles: ['casual', 'modern'],
    materials: ['cotton', 'polyester'],
    searchKeywords: ['fashion', 'clothing', 'shirt', 'white', 'casual', 'cotton'],
    confidence: 0.6
  };
}

// Fallback Country Road items when Firebase is not available
function getFallbackCountryRoadItems() {
  return [
    {
      id: 'fallback-1',
      name: 'Classic White Button-Down Shirt',
      price: 89.00,
      image: 'https://via.placeholder.com/300x300?text=CR+Shirt',
      category: 'Tops',
      subcategory: 'Shirt',
      color: 'White',
      size: 'M',
      brand: 'Country Road',
      material: 'Cotton',
      description: 'A classic white shirt for any occasion.',
      url: 'https://www.countryroad.com.au/fallback-shirt',
      inStock: true,
      seasonality: ['spring', 'summer', 'autumn'],
      formality: 'smart-casual',
      weatherSuitability: { minTemp: 15, maxTemp: 30, conditions: ['sunny', 'cloudy'] }
    },
    {
      id: 'fallback-2',
      name: 'High-Waisted Wide-Leg Trousers',
      price: 129.00,
      image: 'https://via.placeholder.com/300x300?text=CR+Trousers',
      category: 'Bottoms',
      subcategory: 'Trousers',
      color: 'Navy',
      size: 'M',
      brand: 'Country Road',
      material: 'Linen Blend',
      description: 'Comfortable and stylish wide-leg trousers.',
      url: 'https://www.countryroad.com.au/fallback-trousers',
      inStock: true,
      seasonality: ['spring', 'summer'],
      formality: 'casual',
      weatherSuitability: { minTemp: 18, maxTemp: 32, conditions: ['sunny'] }
    }
  ];
}

// Helper function to analyze fashion image with Google Vision
async function analyzeFashionImage(imageUrl) {
  try {
    if (!visionClient) {
      console.log('⚠️ Google Vision not available, using fallback analysis');
      return getFallbackFashionAnalysis();
    }
    
    // Use Google Vision API here
    const [labelResult] = await visionClient.labelDetection(imageUrl);
    const labels = labelResult.labelAnnotations || [];

    const [colorResult] = await visionClient.imageProperties(imageUrl);
    const colors = colorResult.imagePropertiesAnnotation?.dominantColors?.colors || [];

    // Try to localize clothing objects
    let detectedItems = [];
    try {
      const [objectResult] = await visionClient.objectLocalization(imageUrl);
      const objects = objectResult.localizedObjectAnnotations || [];
      const clothingKeywords = ['Person', 'Shirt', 'T-shirt', 'Jacket', 'Coat', 'Blazer', 'Pants', 'Jeans', 'Shorts', 'Skirt', 'Dress', 'Sweater', 'Cardigan', 'Shoe', 'Sneaker', 'Boot', 'Hat', 'Bag'];
      detectedItems = objects
        .filter(o => clothingKeywords.some(k => (o.name || '').toLowerCase().includes(k.toLowerCase())))
        .map(o => ({ type: o.name, score: o.score, boundingPoly: o.boundingPoly }));
    } catch (e) {
      // Best-effort; ignore
    }

    const baseAnalysis = analyzeLabels(labels, colors);
    baseAnalysis.detectedItems = detectedItems;
    return baseAnalysis;
  } catch (error) {
    console.error('Google Vision API error:', error);
    console.log('🔄 Falling back to local analysis');
    return getFallbackFashionAnalysis();
  }
}

// Helper function to analyze labels
function analyzeLabels(labels, colors) {
  const clothingTypes = [];
  const detectedColors = [];
  const patterns = [];
  const styles = [];
  const materials = [];
  const searchKeywords = [];

  // Process labels for fashion information
  labels.forEach(label => {
    const description = label.description.toLowerCase();
    const score = label.score || 0;

    if (score < 0.7) return;

    // Check for clothing types
    if (['shirt', 'dress', 'pants', 'jacket', 'sweater', 'top', 'blouse', 'skirt', 'shorts', 'jeans'].some(keyword => description.includes(keyword))) {
      clothingTypes.push(label.description);
      searchKeywords.push(label.description);
    }
  });

  // Process colors
  colors.forEach(color => {
    if (color.color) {
      const colorName = getColorName(color.color);
      if (colorName) {
        detectedColors.push(colorName);
        searchKeywords.push(colorName);
      }
    }
  });

  return {
    clothingTypes: [...new Set(clothingTypes)],
    colors: [...new Set(detectedColors)],
    patterns: [...new Set(patterns)],
    styles: [...new Set(styles)],
    materials: [...new Set(materials)],
    searchKeywords: [...new Set(searchKeywords)],
    confidence: labels.length > 0 ? labels.reduce((sum, label) => sum + (label.score || 0), 0) / labels.length : 0
  };
}

// Helper function to get color name from RGB
function getColorName(color) {
  const { red, green, blue } = color;
  
  const colorMap = [
    { name: 'white', r: [240, 255], g: [240, 255], b: [240, 255] },
    { name: 'black', r: [0, 30], g: [0, 30], b: [0, 30] },
    { name: 'red', r: [200, 255], g: [0, 100], b: [0, 100] },
    { name: 'blue', r: [0, 100], g: [0, 150], b: [200, 255] },
    { name: 'green', r: [0, 100], g: [150, 255], b: [0, 100] },
    { name: 'yellow', r: [200, 255], g: [200, 255], b: [0, 100] },
    { name: 'pink', r: [200, 255], g: [100, 200], b: [150, 255] },
    { name: 'purple', r: [100, 200], g: [0, 100], b: [150, 255] },
    { name: 'orange', r: [200, 255], g: [100, 200], b: [0, 100] },
    { name: 'brown', r: [100, 200], g: [50, 150], b: [0, 100] },
    { name: 'gray', r: [100, 200], g: [100, 200], b: [100, 200] },
    { name: 'navy', r: [0, 50], g: [0, 50], b: [100, 150] },
    { name: 'beige', r: [200, 255], g: [200, 255], b: [150, 200] }
  ];

  for (const colorDef of colorMap) {
    if (
      red >= colorDef.r[0] && red <= colorDef.r[1] &&
      green >= colorDef.g[0] && green <= colorDef.g[1] &&
      blue >= colorDef.b[0] && blue <= colorDef.b[1]
    ) {
      return colorDef.name;
    }
  }

  return null;
}

// Helper function to generate items from analysis
function generateItemsFromAnalysis(analysis) {
  const items = [];
  const { clothingTypes, colors, styles, materials } = analysis;
  
  for (let i = 0; i < 8; i++) {
    const clothingType = clothingTypes[i % clothingTypes.length] || 'shirt';
    const color = colors[i % colors.length] || 'white';
    const style = styles[i % styles.length] || 'casual';
    const material = materials[i % materials.length] || 'cotton';
    
    items.push({
      id: `server_${i + 1}`,
      name: `${color.charAt(0).toUpperCase() + color.slice(1)} ${clothingType}`,
      brand: getRandomBrand(),
      price: getRandomPrice(),
      image: getColorCodedImage(color, clothingType),
      category: clothingType.toLowerCase(),
      color: color,
      size: 'M',
      retailer: getRandomRetailer(),
      retailerUrl: getRandomRetailerUrl(),
      similarity: 75 + Math.random() * 15 // 75-90%
    });
  }
  
  return items;
}

// Helper functions for item generation
function getRandomBrand() {
  const brands = ['ASOS', 'Zara', 'Uniqlo', 'H&M', 'Cotton On', 'Glassons', 'Witchery', 'Seed Heritage'];
  return brands[Math.floor(Math.random() * brands.length)];
}

function getRandomPrice() {
  return Math.floor(Math.random() * 150) + 30; // $30-$180
}

function getRandomRetailer() {
  const retailers = ['ASOS', 'Zara', 'Uniqlo', 'H&M', 'Cotton On', 'Glassons', 'Witchery', 'Seed Heritage'];
  return retailers[Math.floor(Math.random() * retailers.length)];
}

function getRandomRetailerUrl() {
  const urls = [
    'https://www.asos.com/au/',
    'https://www.zara.com/au/',
    'https://www.uniqlo.com/au/',
    'https://www2.hm.com/en_au/',
    'https://cottonon.com/au/',
    'https://www.glassons.com/au/',
    'https://www.witchery.com.au/',
    'https://www.seedheritage.com/au/'
  ];
  return urls[Math.floor(Math.random() * urls.length)];
}

function getColorCodedImage(color, clothingType) {
  const colorMap = {
    'white': 'FFFFFF',
    'black': '000000',
    'red': 'FF0000',
    'blue': '0000FF',
    'green': '00FF00',
    'yellow': 'FFFF00',
    'pink': 'FF69B4',
    'purple': '800080',
    'orange': 'FFA500',
    'brown': '8B4513',
    'gray': '808080',
    'grey': '808080',
    'navy': '000080',
    'beige': 'F5F5DC',
    'cream': 'FFFDD0',
    'tan': 'D2B48C'
  };
  
  const hexColor = colorMap[color.toLowerCase()] || '808080';
  const textColor = color.toLowerCase() === 'white' || color.toLowerCase() === 'yellow' ? '000000' : 'FFFFFF';
  const text = `${color.charAt(0).toUpperCase() + color.slice(1)} ${clothingType}`;
  
  return `https://via.placeholder.com/300x400/${hexColor}/${textColor}?text=${encodeURIComponent(text)}`;
}

// Debug endpoint to check Firestore collections
app.get('/api/debug/collections', async (req, res) => {
  try {
    console.log('Checking Firestore collections...');
    
    // Check if retailer_products collection exists and has data
    const productsRef = db.collection('retailer_products');
    const snapshot = await productsRef.limit(5).get();
    
    const collections = {
      retailer_products: {
        totalDocs: snapshot.size,
        sampleDocs: []
      }
    };
    
    snapshot.forEach(doc => {
      const data = doc.data();
      collections.retailer_products.sampleDocs.push({
        id: doc.id,
        retailer: data.retailer,
        name: data.name,
        category: data.category
      });
    });
    
    // Check for Country Road specifically - try different query approaches
    let countryRoadSnapshot;
    let queryMethod = 'none';
    
    try {
      // Try querying by retailer.name
      countryRoadSnapshot = await productsRef.where('retailer.name', '==', 'Country Road').limit(5).get();
      queryMethod = 'retailer.name';
    } catch (error) {
      console.log('Query by retailer.name failed:', error.message);
      try {
        // Try querying by retailer.id
        countryRoadSnapshot = await productsRef.where('retailer.id', '==', 'countryroad').limit(5).get();
        queryMethod = 'retailer.id';
      } catch (error2) {
        console.log('Query by retailer.id failed:', error2.message);
        // Try getting all and filtering
        const allSnapshot = await productsRef.limit(10).get();
        countryRoadSnapshot = { size: 0, forEach: () => {} };
        allSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.retailer && data.retailer.name === 'Country Road') {
            countryRoadSnapshot.size++;
            if (countryRoadSnapshot.size <= 5) {
              if (!countryRoadSnapshot.sampleDocs) countryRoadSnapshot.sampleDocs = [];
              countryRoadSnapshot.sampleDocs.push({
                id: doc.id,
                retailer: data.retailer,
                name: data.name,
                category: data.category
              });
            }
          }
        });
        queryMethod = 'manual_filter';
      }
    }
    
    collections.countryRoad = {
      totalDocs: countryRoadSnapshot.size,
      sampleDocs: countryRoadSnapshot.sampleDocs || [],
      queryMethod: queryMethod
    };
    
    if (countryRoadSnapshot.forEach) {
      countryRoadSnapshot.forEach(doc => {
        const data = doc.data();
        if (!collections.countryRoad.sampleDocs) collections.countryRoad.sampleDocs = [];
        collections.countryRoad.sampleDocs.push({
          id: doc.id,
          retailer: data.retailer,
          name: data.name,
          category: data.category
        });
      });
    }
    
    res.json({ success: true, collections });
    
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
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
    return { saved: 0, skipped: 0 };
  }

  const BATCH_LIMIT = 50;
  let savedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < products.length; i += BATCH_LIMIT) {
    const batchProducts = products.slice(i, i + BATCH_LIMIT);
    const batch = db.batch();
    
    for (const product of batchProducts) {
      try {
        batch.set(shoppingCollection.doc(product.id), {
          ...product,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastScraped: new Date().toISOString()
        }, { merge: true });
        savedCount++;
      } catch (error) {
        console.error(`Error processing product ${product.id}:`, error);
        skippedCount++;
      }
    }
    
    try {
      await batch.commit();
    } catch (error) {
      console.error('Error committing batch to database:', error);
      skippedCount += batchProducts.length;
    }
  }

  return { saved: savedCount, skipped: skippedCount };
}

async function getProductsFromDatabase(limit = 100) {
  try {
    const snapshot = await shoppingCollection
      .orderBy('lastScraped', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    
    if (snapshot.empty) return 0;
    
    const batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    
    return snapshot.size;
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

// API endpoint to get Country Road items for the mobile app
app.get('/api/country-road-items', async (req, res) => {
  try {
    console.log('Fetching Country Road items for mobile app...');
    
    if (!db) {
      console.log('⚠️ Firebase not available, returning fallback items');
      return res.json({ success: true, items: getFallbackCountryRoadItems() });
    }
    
    // Get all Country Road products from Firestore
    const productsRef = db.collection('retailer_products');
    
    // Since Firestore queries on nested fields can be problematic, 
    // we'll get all products and filter manually
    const allSnapshot = await productsRef.get();
    const items = [];
    
    allSnapshot.forEach(doc => {
      const data = doc.data();
      // Filter for Country Road products
      if (data.retailer && data.retailer.name === 'Country Road') {
        items.push({
          id: doc.id,
          name: data.name || 'Unknown Item',
          price: data.price || 0,
          originalPrice: data.originalPrice,
          image: data.image || 'https://via.placeholder.com/300x300?text=No+Image',
          category: data.category || 'Unknown',
          subcategory: data.subcategory || 'Unknown',
          color: data.color || 'Unknown',
          size: data.size || 'M',
          brand: data.brand || 'Country Road',
          material: data.material || 'Unknown',
          description: data.description || '',
          url: data.url || '',
          inStock: data.inStock !== false,
          seasonality: data.seasonality || ['all'],
          formality: data.formality || 'casual',
          weatherSuitability: {
            minTemp: data.minTemp || 0,
            maxTemp: data.maxTemp || 40,
            conditions: data.conditions || ['all']
          }
        });
      }
    });
    
    console.log(`Found ${items.length} Country Road items`);
    res.json({ success: true, items: items });
    
  } catch (error) {
    console.error('Error fetching Country Road items:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch Country Road items' });
  }
});

// NOTE: Run the Python scraper on a schedule (e.g., daily) to keep Firestore up to date with Country Road products. 