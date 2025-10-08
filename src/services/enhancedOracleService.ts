// Enhanced AI Stylist Service - Advanced outfit generation with online integration
import { WardrobeItem } from '../types';
import * as WardrobeService from './wardrobeService';

export interface OutfitItem {
  id: string;
  name: string;
  image: string;
  category: string;
  color: string;
  brand?: string;
  price?: string;
  isFromWardrobe: boolean;
  subcategory?: string;
  tags?: string[];
}

export interface OutfitCombination {
  id: string;
  items: OutfitItem[];
  summary: string;
  confidence: number;
  occasion: string;
  weather: string;
  whyItWorks: string[];
  colorHarmony: string;
  styleNotes: string[];
  fitAdvice: string;
  // Enhanced AI Stylist features
  styleAnalysis: StyleAnalysis;
  personalStyleMatch: number;
  trendRelevance: number;
  bodyFlattery: string;
  shoppingSuggestions: ShoppingSuggestion[];
  mixRatio: {
    personalItems: number;
    onlineItems: number;
  };
}

export interface StyleAnalysis {
  colorHarmony: string;
  bodyFlattery: string;
  occasionAppropriate: boolean;
  trendRelevance: number;
  personalStyleMatch: number;
  seasonality: string;
  versatility: number;
  confidence: number;
}

export interface ShoppingSuggestion {
  item: RetailerItem;
  reason: string;
  outfitContext: string;
  urgency: 'high' | 'medium' | 'low';
  alternatives: RetailerItem[];
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface RetailerItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  retailer: string;
  sizes: string[];
  colors: string[];
  fitPrediction?: FitPrediction;
  styleMatch: number;
  category: string;
  subcategory: string;
  tags: string[];
  isFromWardrobe: boolean;
}

export interface FitPrediction {
  overall: 'perfect' | 'good' | 'tight' | 'loose';
  specificAreas: {
    waist: 'snug' | 'comfortable' | 'loose';
    bust: 'snug' | 'comfortable' | 'loose';
    hips: 'snug' | 'comfortable' | 'loose';
  };
  confidence: number;
  recommendations: string[];
}

export interface UserAvatar {
  id: string;
  bodyType: 'pear' | 'apple' | 'hourglass' | 'rectangle';
  measurements: {
    height: number;
    weight: number;
    waist: number;
  };
  fitPreferences: {
    preferredFit: 'snug' | 'comfortable' | 'loose';
    problemAreas: string[];
  };
  createdAt: string;
  lastUpdated: string;
}

export class EnhancedOracleService {
  // Enhanced retailer items with detailed information
  private static retailerItems: RetailerItem[] = [
    {
      id: 'retailer-1',
      name: 'Statement Necklace',
      imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&h=300&fit=crop',
      category: 'Accessories',
      subcategory: 'Necklace',
      color: 'Gold',
      brand: 'Zara',
      price: 29,
      originalPrice: 39,
      retailer: 'Zara',
      sizes: ['One Size'],
      colors: ['Gold', 'Silver'],
      styleMatch: 85,
      tags: ['statement', 'gold', 'elegant'],
      isFromWardrobe: false,
    },
    {
      id: 'retailer-2',
      name: 'Red Heels',
      imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=300&fit=crop',
      category: 'Shoes',
      subcategory: 'Heels',
      color: 'Red',
      brand: 'H&M',
      price: 45,
      originalPrice: 65,
      retailer: 'H&M',
      sizes: ['6', '7', '8', '9', '10'],
      colors: ['Red', 'Black', 'Nude'],
      styleMatch: 90,
      tags: ['heels', 'red', 'elegant', 'party'],
      isFromWardrobe: false,
    },
    {
      id: 'retailer-3',
      name: 'Leather Jacket',
      imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop',
      category: 'Outerwear',
      subcategory: 'Jacket',
      color: 'Black',
      brand: 'ASOS',
      price: 89,
      originalPrice: 129,
      retailer: 'ASOS',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Black', 'Brown', 'Tan'],
      styleMatch: 88,
      tags: ['leather', 'jacket', 'edgy', 'cool'],
      isFromWardrobe: false,
    },
    {
      id: 'retailer-4',
      name: 'Silk Scarf',
      imageUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop',
      category: 'Accessories',
      subcategory: 'Scarf',
      color: 'Patterned',
      brand: 'Uniqlo',
      price: 19,
      originalPrice: 29,
      retailer: 'Uniqlo',
      sizes: ['One Size'],
      colors: ['Patterned', 'Solid'],
      styleMatch: 82,
      tags: ['silk', 'scarf', 'patterned', 'luxury'],
      isFromWardrobe: false,
    },
    {
      id: 'retailer-5',
      name: 'White Blouse',
      imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=300&fit=crop',
      category: 'Tops',
      subcategory: 'Blouse',
      color: 'White',
      brand: 'COS',
      price: 65,
      originalPrice: 95,
      retailer: 'COS',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['White', 'Black', 'Navy'],
      styleMatch: 92,
      tags: ['blouse', 'white', 'professional', 'elegant'],
      isFromWardrobe: false,
    },
    {
      id: 'retailer-6',
      name: 'Black Trousers',
      imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=300&fit=crop',
      category: 'Bottoms',
      subcategory: 'Trousers',
      color: 'Black',
      brand: 'Mango',
      price: 55,
      originalPrice: 79,
      retailer: 'Mango',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Black', 'Navy', 'Gray'],
      styleMatch: 88,
      tags: ['trousers', 'black', 'professional', 'versatile'],
      isFromWardrobe: false,
    },
  ];

  // Convert WardrobeItem to OutfitItem
  private static convertWardrobeItem(item: WardrobeItem): OutfitItem {
    return {
      id: item.id,
      name: item.name,
      image: item.imageUrl,
      category: item.category.charAt(0).toUpperCase() + item.category.slice(1),
      color: item.color,
      brand: item.brand,
      isFromWardrobe: true,
      subcategory: item.subcategory,
      tags: item.tags,
    };
  }

  // Convert RetailerItem to OutfitItem
  private static convertRetailerItem(item: RetailerItem): OutfitItem {
    return {
      id: item.id,
      name: item.name,
      image: item.imageUrl,
      category: item.category,
      color: item.color,
      brand: item.brand,
      price: `$${item.price}`,
      isFromWardrobe: false,
      subcategory: item.subcategory,
      tags: item.tags,
    };
  }

  // Get real wardrobe items from Firestore
  private static async getRealWardrobeItems(userId?: string): Promise<OutfitItem[]> {
    try {
      if (!userId) {
        console.log('No userId provided, using fallback items');
        return this.getFallbackWardrobeItems();
      }
      const wardrobeItems = await WardrobeService.getUserWardrobe(userId);
      console.log('Fetched wardrobe items:', wardrobeItems.length);
      
      if (wardrobeItems.length === 0) {
        console.log('No wardrobe items found, using fallback items');
        return this.getFallbackWardrobeItems();
      }
      
      return wardrobeItems.map(item => this.convertWardrobeItem(item));
    } catch (error) {
      console.error('Error fetching wardrobe items:', error);
      return this.getFallbackWardrobeItems();
    }
  }

  // Fallback wardrobe items if Firestore fails
  private static getFallbackWardrobeItems(): OutfitItem[] {
    return [
      {
        id: 'fallback-1',
        name: 'White T-shirt',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
        category: 'Tops',
        color: 'White',
        brand: 'Basic',
        isFromWardrobe: true,
        subcategory: 'T-shirt',
        tags: ['basic', 'white', 'casual'],
      },
      {
        id: 'fallback-2',
        name: 'Blue Jeans',
        image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=300&fit=crop',
        category: 'Bottoms',
        color: 'Blue',
        brand: 'Levi\'s',
        isFromWardrobe: true,
        subcategory: 'Jeans',
        tags: ['denim', 'blue', 'casual'],
      },
      {
        id: 'fallback-3',
        name: 'Black Blazer',
        image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=300&fit=crop',
        category: 'Outerwear',
        color: 'Black',
        brand: 'H&M',
        isFromWardrobe: true,
        subcategory: 'Blazer',
        tags: ['blazer', 'black', 'professional'],
      },
      {
        id: 'fallback-4',
        name: 'White Sneakers',
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop',
        category: 'Shoes',
        color: 'White',
        brand: 'Converse',
        isFromWardrobe: true,
        subcategory: 'Sneakers',
        tags: ['sneakers', 'white', 'casual'],
      },
      {
        id: 'fallback-5',
        name: 'Black Dress',
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=300&fit=crop',
        category: 'Dresses',
        color: 'Black',
        brand: 'Zara',
        isFromWardrobe: true,
        subcategory: 'Dress',
        tags: ['dress', 'black', 'elegant'],
      },
    ];
  }

  // Enhanced style analysis
  private static analyzeStyle(
    items: OutfitItem[],
    occasion: string,
    weather: string,
    userAvatar?: UserAvatar
  ): StyleAnalysis {
    const colors = items.map(item => item.color.toLowerCase());
    const categories = items.map(item => item.category.toLowerCase());
    
    // Color harmony analysis
    let colorHarmony = 'Neutral palette with balanced tones';
    if (colors.includes('black') && colors.includes('white')) {
      colorHarmony = 'Classic monochrome - timeless and sophisticated';
    } else if (colors.includes('blue') && colors.includes('white')) {
      colorHarmony = 'Fresh nautical palette - clean and crisp';
    } else if (colors.some(c => ['red', 'pink', 'coral'].includes(c))) {
      colorHarmony = 'Bold accent colors - confident and eye-catching';
    }

    // Body flattery analysis
    let bodyFlattery = 'Balanced proportions create a flattering silhouette';
    if (userAvatar) {
      if (userAvatar.bodyType === 'pear' && categories.includes('tops') && categories.includes('bottoms')) {
        bodyFlattery = 'Emphasizes your waist and balances your proportions perfectly';
      } else if (userAvatar.bodyType === 'apple' && categories.includes('dresses')) {
        bodyFlattery = 'Creates a defined waistline and elongates your figure';
      } else if (userAvatar.bodyType === 'hourglass') {
        bodyFlattery = 'Accentuates your natural curves and creates an elegant silhouette';
      }
    }

    // Occasion appropriateness
    const occasionAppropriate = this.isOccasionAppropriate(items, occasion);

    // Trend relevance (mock data for now)
    const trendRelevance = Math.floor(Math.random() * 40) + 60; // 60-100%

    // Personal style match (mock data for now)
    const personalStyleMatch = Math.floor(Math.random() * 30) + 70; // 70-100%

    // Seasonality
    const seasonality = this.getSeasonality(weather);

    // Versatility
    const versatility = this.calculateVersatility(items);

    return {
      colorHarmony,
      bodyFlattery,
      occasionAppropriate,
      trendRelevance,
      personalStyleMatch,
      seasonality,
      versatility,
      confidence: Math.floor((trendRelevance + personalStyleMatch) / 2),
    };
  }

  // Check if outfit is appropriate for occasion
  private static isOccasionAppropriate(items: OutfitItem[], occasion: string): boolean {
    const categories = items.map(item => item.category.toLowerCase());
    
    switch (occasion.toLowerCase()) {
      case 'professional':
      case 'interview':
        return categories.includes('blazer') || categories.includes('dress');
      case 'casual':
        return categories.includes('t-shirt') || categories.includes('jeans');
      case 'date':
        return categories.includes('dress') || (categories.includes('blouse') && categories.includes('jeans'));
      case 'party':
        return categories.includes('dress') || categories.includes('jacket');
      default:
        return true;
    }
  }

  // Get seasonality based on weather
  private static getSeasonality(weather: string): string {
    const temp = parseInt(weather.replace('°', ''));
    if (temp < 10) return 'Winter - perfect for layering and cozy textures';
    if (temp < 20) return 'Spring/Fall - ideal for transitional pieces';
    return 'Summer - light and breathable fabrics';
  }

  // Calculate versatility score
  private static calculateVersatility(items: OutfitItem[]): number {
    const categories = items.map(item => item.category.toLowerCase());
    const colors = items.map(item => item.color.toLowerCase());
    
    let score = 50; // Base score
    
    // Bonus for neutral colors
    if (colors.some(c => ['black', 'white', 'navy', 'gray'].includes(c))) {
      score += 20;
    }
    
    // Bonus for versatile categories
    if (categories.includes('jeans') || categories.includes('blazer')) {
      score += 15;
    }
    
    // Bonus for mix of formal and casual
    const hasFormal = categories.some(c => ['blazer', 'dress', 'blouse'].includes(c));
    const hasCasual = categories.some(c => ['t-shirt', 'jeans', 'sneakers'].includes(c));
    if (hasFormal && hasCasual) {
      score += 15;
    }
    
    return Math.min(score, 100);
  }

  // Generate shopping suggestions
  private static generateShoppingSuggestions(
    outfit: OutfitItem[],
    occasion: string,
    userAvatar?: UserAvatar
  ): ShoppingSuggestion[] {
    const suggestions: ShoppingSuggestion[] = [];
    const categories = outfit.map(item => item.category.toLowerCase());
    
    // Check for missing essential pieces
    if (!categories.includes('accessories') && (occasion === 'date' || occasion === 'party')) {
      const necklace = this.retailerItems.find(item => item.subcategory === 'Necklace');
      if (necklace) {
        suggestions.push({
          item: necklace,
          reason: 'Adds elegance and completes the look',
          outfitContext: 'Perfect finishing touch for your outfit',
          urgency: 'medium',
          alternatives: this.retailerItems.filter(item => item.subcategory === 'Necklace'),
          priceRange: { min: 20, max: 50, currency: 'USD' },
        });
      }
    }
    
    if (!categories.includes('shoes') && occasion === 'professional') {
      const heels = this.retailerItems.find(item => item.subcategory === 'Heels');
      if (heels) {
        suggestions.push({
          item: heels,
          reason: 'Professional footwear completes the business look',
          outfitContext: 'Essential for a polished professional appearance',
          urgency: 'high',
          alternatives: this.retailerItems.filter(item => item.subcategory === 'Heels'),
          priceRange: { min: 40, max: 120, currency: 'USD' },
        });
      }
    }
    
    return suggestions;
  }

  // Calculate mix ratio
  private static calculateMixRatio(items: OutfitItem[]): { personalItems: number; onlineItems: number } {
    const personalCount = items.filter(item => item.isFromWardrobe).length;
    const totalCount = items.length;
    
    return {
      personalItems: Math.round((personalCount / totalCount) * 100),
      onlineItems: Math.round(((totalCount - personalCount) / totalCount) * 100),
    };
  }

  // Generate enhanced outfit combinations
  static async generateEnhancedOutfits(
    occasion: string = 'casual',
    weather: string = '22°',
    count: number = 3,
    userId?: string,
    userAvatar?: UserAvatar
  ): Promise<OutfitCombination[]> {
    const combinations: OutfitCombination[] = [];
    const wardrobeItems = await this.getRealWardrobeItems(userId);
    const retailerItems = this.retailerItems;
    
    console.log('Generating enhanced outfits with', wardrobeItems.length, 'wardrobe items');
    
    // Generate casual outfits
    if (occasion === 'casual') {
      if (wardrobeItems.length >= 2) {
        const casualOutfit = {
          id: 'enhanced-casual-1',
          items: [
            wardrobeItems[0], // White T-shirt
            wardrobeItems[1], // Blue Jeans
            this.convertRetailerItem(retailerItems[3]), // Silk Scarf
            wardrobeItems[3] || this.convertRetailerItem(retailerItems[1]), // White Sneakers or Red Heels
          ],
          summary: 'Effortlessly chic casual ensemble that balances comfort with style. The silk scarf adds a touch of luxury while maintaining the relaxed vibe.',
          confidence: 94,
          occasion: 'Casual',
          weather: weather,
          whyItWorks: [
            'Classic white and blue combination never goes wrong',
            'Silk scarf adds texture and sophistication',
            'Comfortable for all-day wear',
            'Easy to layer with jackets or cardigans',
            'Perfect for coffee dates or weekend errands'
          ],
          colorHarmony: 'Fresh nautical palette with elegant texture',
          styleNotes: [
            'The white tee creates a clean foundation',
            'Dark jeans provide structure and sophistication',
            'Silk scarf adds movement and luxury',
            'Sneakers keep it comfortable and modern'
          ],
          fitAdvice: 'Tuck the front of the tee slightly for a more polished look',
          styleAnalysis: this.analyzeStyle([
            wardrobeItems[0],
            wardrobeItems[1],
            this.convertRetailerItem(retailerItems[3]),
            wardrobeItems[3] || this.convertRetailerItem(retailerItems[1])
          ], occasion, weather, userAvatar),
          personalStyleMatch: 88,
          trendRelevance: 85,
          bodyFlattery: 'Elongates the silhouette and creates balanced proportions',
          shoppingSuggestions: this.generateShoppingSuggestions([
            wardrobeItems[0],
            wardrobeItems[1],
            this.convertRetailerItem(retailerItems[3])
          ], occasion, userAvatar),
          mixRatio: this.calculateMixRatio([
            wardrobeItems[0],
            wardrobeItems[1],
            this.convertRetailerItem(retailerItems[3]),
            wardrobeItems[3] || this.convertRetailerItem(retailerItems[1])
          ]),
        };
        
        combinations.push(casualOutfit);
      }
    }
    
    // Generate professional outfits
    if (occasion === 'professional' || occasion === 'interview') {
      if (wardrobeItems.length >= 2) {
        const professionalOutfit = {
          id: 'enhanced-professional-1',
          items: [
            this.convertRetailerItem(retailerItems[4]), // White Blouse
            this.convertRetailerItem(retailerItems[5]), // Black Trousers
            wardrobeItems[2] || this.convertRetailerItem(retailerItems[3]), // Black Blazer or Silk Scarf
            this.convertRetailerItem(retailerItems[1]), // Red Heels
          ],
          summary: 'Powerful professional look that commands respect while maintaining approachability. Perfect for interviews and important meetings.',
          confidence: 96,
          occasion: 'Professional',
          weather: weather,
          whyItWorks: [
            'Classic professional color palette',
            'Structured pieces create authority',
            'Red heels add confidence and personality',
            'Versatile enough for different professional settings',
            'Timeless combination that never goes out of style'
          ],
          colorHarmony: 'Sophisticated monochrome with bold red accent',
          styleNotes: [
            'White blouse creates a clean, professional base',
            'Black trousers provide structure and sophistication',
            'Blazer adds authority and polish',
            'Red heels inject personality and confidence'
          ],
          fitAdvice: 'Ensure the blazer fits perfectly in the shoulders for maximum impact',
          styleAnalysis: this.analyzeStyle([
            this.convertRetailerItem(retailerItems[4]),
            this.convertRetailerItem(retailerItems[5]),
            wardrobeItems[2] || this.convertRetailerItem(retailerItems[3]),
            this.convertRetailerItem(retailerItems[1])
          ], occasion, weather, userAvatar),
          personalStyleMatch: 92,
          trendRelevance: 88,
          bodyFlattery: 'Creates a powerful, elongated silhouette',
          shoppingSuggestions: this.generateShoppingSuggestions([
            this.convertRetailerItem(retailerItems[4]),
            this.convertRetailerItem(retailerItems[5]),
            this.convertRetailerItem(retailerItems[1])
          ], occasion, userAvatar),
          mixRatio: this.calculateMixRatio([
            this.convertRetailerItem(retailerItems[4]),
            this.convertRetailerItem(retailerItems[5]),
            wardrobeItems[2] || this.convertRetailerItem(retailerItems[3]),
            this.convertRetailerItem(retailerItems[1])
          ]),
        };
        
        combinations.push(professionalOutfit);
      }
    }
    
    return combinations.slice(0, count);
  }

  // Generate single enhanced outfit
  static async generateEnhancedInstantOutfit(
    occasion: string = 'casual',
    weather: string = '22°',
    userId?: string,
    userAvatar?: UserAvatar
  ): Promise<OutfitCombination> {
    const outfits = await this.generateEnhancedOutfits(occasion, weather, 1, userId, userAvatar);
    return outfits[0] || this.getDefaultEnhancedOutfit(userId, userAvatar);
  }

  // Get default enhanced outfit
  private static getDefaultEnhancedOutfit(userId?: string, userAvatar?: UserAvatar): OutfitCombination {
    const fallbackItems = this.getFallbackWardrobeItems();
    
    return {
      id: 'default-enhanced',
      items: fallbackItems.slice(0, 3),
      summary: 'A versatile, stylish ensemble perfect for any occasion. This combination balances comfort with sophistication.',
      confidence: 85,
      occasion: 'Casual',
      weather: '22°',
      whyItWorks: [
        'Classic color combination that works for everyone',
        'Comfortable and easy to wear',
        'Versatile for multiple occasions',
        'Easy to accessorize and layer'
      ],
      colorHarmony: 'Neutral palette with balanced proportions',
      styleNotes: [
        'Clean, simple lines create elegance',
        'Neutral colors are universally flattering',
        'Comfortable for all-day wear'
      ],
      fitAdvice: 'Choose pieces that fit well and make you feel confident',
      styleAnalysis: this.analyzeStyle(fallbackItems.slice(0, 3), 'casual', '22°', userAvatar),
      personalStyleMatch: 75,
      trendRelevance: 80,
      bodyFlattery: 'Creates a balanced, flattering silhouette',
      shoppingSuggestions: [],
      mixRatio: { personalItems: 100, onlineItems: 0 },
    };
  }
}
