import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedProduct {
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

function extractPrice(priceText: string): number {
  const match = priceText.match(/[\d,]+\.?\d*/);
  if (match) {
    return parseFloat(match[0].replace(/,/g, ''));
  }
  return 0;
}

function inferCategory(url: string, name: string): { category: string; subcategory: string } {
  const urlLower = url.toLowerCase();
  const nameLower = name.toLowerCase();

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

export async function scrapeCountryRoadProducts(categoryFilter?: string): Promise<ScrapedProduct[]> {
  const items: ScrapedProduct[] = [];
  const baseUrl = 'https://www.countryroad.com.au';

  const categoryUrls = [
    { url: '/women/clothing/tops', category: 'Tops' },
    { url: '/women/clothing/dresses', category: 'Dresses' },
    { url: '/women/clothing/outerwear', category: 'Outerwear' },
    { url: '/women/clothing/bottoms', category: 'Bottoms' },
    { url: '/men/clothing/tops', category: 'Tops' },
    { url: '/men/clothing/outerwear', category: 'Outerwear' },
    { url: '/men/clothing/bottoms', category: 'Bottoms' },
  ];

  for (const { url, category } of categoryUrls) {
    if (categoryFilter && category.toLowerCase() !== categoryFilter.toLowerCase()) {
      continue;
    }

    try {
      const fullUrl = `${baseUrl}${url}`;
      console.log(`Scraping: ${fullUrl}`);

      const response = await axios.get(fullUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);

      const productSelectors = [
        'article[data-testid="product-card"]',
        '.product-tile',
        '.product-card',
        '[data-product-id]',
        '.product-item',
        'a[href*="/products/"]',
      ];

      let productElements: any = null;

      for (const selector of productSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          productElements = elements;
          console.log(`Found ${elements.length} products using selector: ${selector}`);
          break;
        }
      }

      if (!productElements || productElements.length === 0) {
        const links = $('a[href*="/products/"]');
        if (links.length > 0) {
          productElements = links;
          console.log(`Found ${links.length} product links`);
        }
      }

      if (!productElements || productElements.length === 0) continue;

      productElements.each((index: number, element: any) => {
        try {
          const $el = $(element);

          const productUrl = $el.attr('href') || $el.find('a').attr('href') || '';
          if (!productUrl) return;

          const fullProductUrl = productUrl.startsWith('http')
            ? productUrl
            : `${baseUrl}${productUrl.startsWith('/') ? productUrl : '/' + productUrl}`;

          const name = $el.find('[data-testid="product-name"]').text().trim() ||
                      $el.find('.product-name').text().trim() ||
                      $el.find('h2').text().trim() ||
                      $el.find('h3').text().trim() ||
                      $el.attr('title') ||
                      $el.text().trim().split('\n')[0] ||
                      '';

          if (!name) return;

          const priceText = $el.find('[data-testid="product-price"]').text().trim() ||
                           $el.find('.price').text().trim() ||
                           $el.find('.product-price').text().trim() ||
                           $el.text().match(/\$\d+\.?\d*/)?.[0] ||
                           '';

          const price = extractPrice(priceText);
          if (!price) return;

          const imageAttr = $el.find('img').attr('src') ||
                           $el.find('img').attr('data-src') ||
                           $el.find('img').attr('data-lazy-src') ||
                           '';

          const image = imageAttr
            ? (imageAttr.startsWith('http')
                ? imageAttr
                : imageAttr.startsWith('//')
                  ? `https:${imageAttr}`
                  : `${baseUrl}${imageAttr.startsWith('/') ? imageAttr : '/' + imageAttr}`)
            : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop';

          const color = $el.find('[data-color]').attr('data-color') ||
                       $el.find('.color').text().trim() ||
                       'Various';

          const { category: inferredCategory, subcategory } = inferCategory(fullProductUrl, name);
          const formality = inferFormality(inferredCategory, name);
          const weatherSuitability = inferWeatherSuitability(inferredCategory, name);

          const id = `cr-${fullProductUrl.split('/').pop()?.replace(/[^a-z0-9]/gi, '-') || Date.now()}-${index}`;

          items.push({
            id,
            name: name.substring(0, 200),
            price,
            image,
            category: inferredCategory,
            subcategory,
            color,
            brand: 'Country Road',
            url: fullProductUrl,
            inStock: true,
            formality,
            weatherSuitability,
          });
        } catch (err) {
          console.error('Error parsing product element', err);
        }
      });

      if (items.length >= 80) break;
    } catch (err) {
      console.error('Error scraping category', url, err);
    }
  }

  console.log(`Scraped ${items.length} Country Road products`);
  return items;
}
