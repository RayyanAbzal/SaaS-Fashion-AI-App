// Style Oracle Service - Generates visual outfit combinations
import { WardrobeItem } from '../types';
import * as WardrobeService from './wardrobeService';
import { OutfitGenerator } from './outfitGenerator';
import SmartOutfitGenerator from './smartOutfitGenerator';
import CountryRoadService from './countryRoadService';

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
  styleAnalysis?: StyleAnalysis;
  personalStyleMatch?: number;
  trendRelevance?: number;
  bodyFlattery?: string;
  shoppingSuggestions?: ShoppingSuggestion[];
  mixRatio?: {
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
  bodyType: 'pear' | 'apple' | 'hourglass' | 'rectangle';
  height: number;
  weight: number;
  measurements: {
    bust: number;
    waist: number;
    hips: number;
  };
  fitPreferences: {
    preferredFit: 'snug' | 'comfortable' | 'loose';
    problemAreas: string[];
  };
}

export class OracleService {
  // Convert WardrobeItem to OutfitItem
  private static convertWardrobeItem(item: WardrobeItem): OutfitItem {
    if (!item) {
      console.error('Invalid item provided to convertWardrobeItem');
      return null;
    }
    
    return {
      id: item.id || 'unknown',
      name: item.name || 'Unknown Item',
      image: item.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image',
      category: item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : 'Unknown',
      color: item.color || 'Unknown',
      brand: item.brand || 'Unknown',
      isFromWardrobe: true,
      subcategory: item.subcategory || 'Unknown',
      tags: item.tags || [],
    };
  }

  // Get real wardrobe items from Firestore
  private static async getRealWardrobeItems(userId?: string): Promise<OutfitItem[]> {
    try {
      console.log('getRealWardrobeItems called with userId:', userId);
      
      if (!userId) {
        // If no userId provided, use fallback items
        console.log('No userId provided, using fallback items');
        return this.getFallbackWardrobeItems();
      }
      
      console.log('Fetching wardrobe items...');
      const wardrobeItems = await WardrobeService.getUserWardrobe(userId);
      console.log('Fetched wardrobe items:', wardrobeItems);
      console.log('Wardrobe items length:', wardrobeItems?.length || 'undefined');
      
      if (!wardrobeItems || wardrobeItems.length === 0) {
        console.log('No wardrobe items found, using fallback items');
        return this.getFallbackWardrobeItems();
      }
      
      console.log('Converting wardrobe items...');
      const convertedItems = wardrobeItems
        .map(item => {
          console.log('Converting item:', item);
          return this.convertWardrobeItem(item);
        })
        .filter(item => item !== null);
      
      console.log('Converted items:', convertedItems.length);
      return convertedItems;
    } catch (error) {
      console.error('Error fetching wardrobe items:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      return this.getFallbackWardrobeItems();
    }
  }

  // Get retailer items for outfit generation
  static async getRetailerItems(): Promise<OutfitItem[]> {
    try {
      console.log('Fetching Country Road items...');
      const countryRoadItems = await CountryRoadService.getItems();
      
      return countryRoadItems.map(item => CountryRoadService.convertToOutfitItem(item));
    } catch (error) {
      console.error('Error fetching Country Road items:', error);
      // Fallback to mock data if Country Road service fails
      return this.getFallbackRetailerItems();
    }
  }

  // Fallback retailer items if Country Road service fails
  private static getFallbackRetailerItems(): OutfitItem[] {
    // Return empty array if no real data available
    console.warn('No Country Road data available - returning empty array');
    return [];
  }

  // Get wardrobe items (public method)
  static async getWardrobeItems(userId?: string): Promise<OutfitItem[]> {
    return this.getRealWardrobeItems(userId);
  }

  // Fallback wardrobe items if Firestore fails
  private static getFallbackWardrobeItems(): OutfitItem[] {
    return [
      {
        id: 'wardrobe-1',
        name: 'Classic White T-Shirt',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
        category: 'Tops',
        color: 'White',
        brand: 'Basic',
        isFromWardrobe: true,
        subcategory: 'T-shirt',
        tags: ['basic', 'casual', 'versatile'],
      },
      {
        id: 'wardrobe-2',
        name: 'Dark Blue Jeans',
        image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=300&fit=crop',
        category: 'Bottoms',
        color: 'Blue',
        brand: 'Denim',
        isFromWardrobe: true,
        subcategory: 'Jeans',
        tags: ['denim', 'casual', 'classic'],
      },
      {
        id: 'wardrobe-3',
        name: 'Black Blazer',
        image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&h=300&fit=crop',
        category: 'Outerwear',
        color: 'Black',
        brand: 'Professional',
        isFromWardrobe: true,
        subcategory: 'Blazer',
        tags: ['professional', 'formal', 'structured'],
      },
      {
        id: 'wardrobe-4',
        name: 'White Sneakers',
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop',
        category: 'Shoes',
        color: 'White',
        brand: 'Athletic',
        isFromWardrobe: true,
        subcategory: 'Sneakers',
        tags: ['casual', 'comfortable', 'versatile'],
      },
      {
        id: 'wardrobe-5',
        name: 'Black Dress',
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=300&fit=crop',
        category: 'Dresses',
        color: 'Black',
        brand: 'Classic',
        isFromWardrobe: true,
        subcategory: 'Midi Dress',
        tags: ['elegant', 'versatile', 'timeless'],
      },
    ];
  }


  // Generate outfit combinations based on occasion and weather
  static async generateOutfitCombinations(
    occasion: string = 'casual',
    weather: string = '22°',
    count: number = 3,
    userId?: string
  ): Promise<OutfitCombination[]> {
    // Parse weather data
    const temperature = parseInt(weather.replace('°', ''));
    const weatherData = {
      temperature,
      condition: temperature > 25 ? 'sunny' : temperature < 15 ? 'cloudy' : 'partly-cloudy',
      humidity: 60,
      season: this.getCurrentSeason(temperature)
    };

    // Get wardrobe and retailer items
    const wardrobeItems = await this.getRealWardrobeItems(userId);
    const retailerItems = await this.getRetailerItems();

    // Convert to smart outfit items
    const smartWardrobeItems = this.convertToSmartItems(wardrobeItems);
    const smartRetailerItems = this.convertToSmartItems(retailerItems);

    // Use smart outfit generator
    const smartOutfits = await SmartOutfitGenerator.generateSmartOutfits(
      occasion,
      weatherData,
      smartWardrobeItems,
      smartRetailerItems,
      count
    );

    return smartOutfits;
  }

  // Get current season based on temperature
  private static getCurrentSeason(temperature: number): 'spring' | 'summer' | 'autumn' | 'winter' {
    if (temperature > 25) return 'summer';
    if (temperature > 20) return 'spring';
    if (temperature > 10) return 'autumn';
    return 'winter';
  }

  // Convert regular items to smart outfit items
  private static convertToSmartItems(items: OutfitItem[]): any[] {
    return items.map(item => ({
      ...item,
      material: this.getMaterialFromItem(item),
      materialProperties: this.getMaterialProperties(this.getMaterialFromItem(item)),
      colorAnalysis: this.getColorAnalysis(item.color),
      weatherSuitability: this.getWeatherSuitability(item),
      occasionSuitability: this.getOccasionSuitability(item)
    }));
  }

  // Get material from item (simplified)
  private static getMaterialFromItem(item: OutfitItem): string {
    const name = item.name.toLowerCase();
    if (name.includes('cotton')) return 'cotton';
    if (name.includes('wool')) return 'wool';
    if (name.includes('cashmere')) return 'cashmere';
    if (name.includes('silk')) return 'silk';
    if (name.includes('denim')) return 'denim';
    if (name.includes('leather')) return 'leather';
    if (name.includes('linen')) return 'linen';
    return 'cotton'; // default
  }

  // Get material properties
  private static getMaterialProperties(material: string): any {
    const materials = {
      'cotton': { breathability: 9, warmth: 3, waterResistance: 2, seasonality: ['spring', 'summer', 'autumn'], formality: 'casual' },
      'wool': { breathability: 6, warmth: 8, waterResistance: 5, seasonality: ['autumn', 'winter'], formality: 'smart-casual' },
      'cashmere': { breathability: 7, warmth: 9, waterResistance: 3, seasonality: ['autumn', 'winter'], formality: 'business' },
      'silk': { breathability: 8, warmth: 4, waterResistance: 2, seasonality: ['spring', 'summer', 'autumn'], formality: 'business' },
      'denim': { breathability: 5, warmth: 4, waterResistance: 3, seasonality: ['spring', 'summer', 'autumn', 'winter'], formality: 'casual' },
      'leather': { breathability: 2, warmth: 6, waterResistance: 8, seasonality: ['autumn', 'winter'], formality: 'smart-casual' },
      'linen': { breathability: 10, warmth: 2, waterResistance: 1, seasonality: ['spring', 'summer'], formality: 'casual' }
    };
    return materials[material] || materials['cotton'];
  }

  // Get color analysis
  private static getColorAnalysis(color: string): any {
    const colorLower = color.toLowerCase();
    return {
      primary: colorLower,
      secondary: colorLower,
      harmony: 'neutral',
      seasonality: this.getColorSeasonality(colorLower),
      formality: this.getColorFormality(colorLower),
      skinToneCompatibility: ['neutral']
    };
  }

  // Get color seasonality
  private static getColorSeasonality(color: string): string[] {
    if (['white', 'light', 'pastel'].some(c => color.includes(c))) return ['spring', 'summer'];
    if (['dark', 'black', 'navy'].some(c => color.includes(c))) return ['autumn', 'winter'];
    if (['warm', 'earth', 'brown'].some(c => color.includes(c))) return ['autumn'];
    return ['spring', 'summer', 'autumn', 'winter'];
  }

  // Get color formality
  private static getColorFormality(color: string): string {
    if (['black', 'navy', 'white'].some(c => color.includes(c))) return 'formal';
    if (['bright', 'neon'].some(c => color.includes(c))) return 'casual';
    return 'smart-casual';
  }

  // Get weather suitability
  private static getWeatherSuitability(item: OutfitItem): any {
    const category = item.category.toLowerCase();
    const color = item.color.toLowerCase();
    
    let minTemp = 15;
    let maxTemp = 30;
    let conditions = ['sunny', 'cloudy'];
    let seasonality = ['spring', 'summer', 'autumn', 'winter'];

    // Adjust based on category
    if (category.includes('jacket') || category.includes('blazer')) {
      minTemp = 10;
      maxTemp = 25;
    }
    if (category.includes('shirt') || category.includes('top')) {
      minTemp = 15;
      maxTemp = 35;
    }
    if (category.includes('shoes')) {
      minTemp = 5;
      maxTemp = 35;
    }

    // Adjust based on color
    if (['white', 'light'].some(c => color.includes(c))) {
      maxTemp = 35;
      seasonality = ['spring', 'summer'];
    }
    if (['dark', 'black', 'navy'].some(c => color.includes(c))) {
      minTemp = 5;
      seasonality = ['autumn', 'winter'];
    }

    return { minTemp, maxTemp, conditions, seasonality };
  }

  // Get occasion suitability
  private static getOccasionSuitability(item: OutfitItem): string[] {
    const category = item.category.toLowerCase();
    const color = item.color.toLowerCase();
    
    let occasions = ['casual'];
    
    // Add occasions based on category
    if (category.includes('blazer') || category.includes('suit')) {
      occasions.push('work', 'business', 'formal');
    }
    if (category.includes('dress')) {
      occasions.push('date', 'party', 'formal');
    }
    if (category.includes('jeans')) {
      occasions.push('casual', 'smart-casual');
    }
    if (category.includes('shirt')) {
      occasions.push('work', 'business', 'smart-casual');
    }

    // Add occasions based on color
    if (['black', 'navy'].some(c => color.includes(c))) {
      occasions.push('formal', 'business');
    }
    if (['white'].some(c => color.includes(c))) {
      occasions.push('work', 'business', 'casual');
    }

    return [...new Set(occasions)];
  }

  // Legacy method for backward compatibility
  static async generateOutfitCombinationsLegacy(
    occasion: string = 'casual',
    weather: string = '22°',
    count: number = 3,
    userId?: string
  ): Promise<OutfitCombination[]> {
    const combinations: OutfitCombination[] = [];
    const wardrobeItems = await this.getRealWardrobeItems(userId);
    
    console.log('Generating outfit combinations with', wardrobeItems.length, 'wardrobe items');
    console.log('Wardrobe items:', wardrobeItems.map(item => ({ id: item.id, name: item.name, image: item.image })));

    // Casual outfit combinations
    if (occasion === 'casual') {
      // Ensure we have enough items
      if (wardrobeItems.length >= 4) {
        combinations.push({
          id: 'casual-1',
          items: [
            wardrobeItems[0], // White T-shirt
            wardrobeItems[1], // Blue Jeans
            wardrobeItems[3], // White Sneakers
            ],
          summary: 'A timeless casual ensemble that balances comfort with effortless style. The crisp white tee creates a clean foundation while the dark indigo jeans provide structure and sophistication.',
          confidence: 92,
          occasion: 'Casual',
          weather: weather,
          colorHarmony: 'Monochromatic with blue undertones - creates visual flow and sophistication',
          styleNotes: [
            'The white tee acts as a neutral canvas, making your skin tone pop',
            'Dark wash jeans elongate the legs and create a slimming silhouette',
            'White sneakers add a modern, clean finish that\'s both comfortable and stylish'
          ],
          fitAdvice: 'Tuck the front of the tee slightly for a more polished look, or leave it loose for relaxed vibes',
          whyItWorks: [
            'Classic color combination that never goes wrong - white and blue are complementary',
            'The contrast between light top and dark bottom creates visual balance',
            'Comfortable for all-day wear without sacrificing style',
            'Easy to layer with jackets, cardigans, or accessories',
            'Works for most casual settings from coffee dates to weekend errands'
          ],
        });
      }

      if (wardrobeItems.length >= 4) {
        combinations.push({
          id: 'casual-2',
          items: [
            wardrobeItems[0], // White T-shirt
            wardrobeItems[1], // Blue Jeans
            this.retailerItems[4], // Cashmere Scarf
            wardrobeItems[3], // White Sneakers
            ],
          summary: 'Elevated casual with sophisticated layering. The Country Road cashmere scarf adds luxury and personality while maintaining the effortless appeal of your basics.',
          confidence: 88,
          occasion: 'Casual',
          weather: weather,
          colorHarmony: 'Neutral base with accent pattern - the scarf\'s colors should complement your skin tone',
          styleNotes: [
            'The silk scarf adds texture and movement to the simple silhouette',
            'Pattern breaks up the solid colors and adds visual interest',
            'Scarf can be styled multiple ways - around neck, as headband, or tied to bag',
            'Maintains the comfort of casual wear while looking more intentional'
          ],
          fitAdvice: 'Drape the scarf loosely for a relaxed look, or tie it in a knot for more structure',
          whyItWorks: [
            'Scarf adds visual interest to simple basics without overwhelming the look',
            'Pattern creates focal point and draws attention upward toward your face',
            'Still comfortable and easy to wear - no sacrifice in functionality',
            'Shows you put thought into your outfit without trying too hard',
            'Can be easily removed if you get too warm or want to simplify'
          ],
        });
      }
    }

    // Professional outfit combinations
    if (occasion === 'interview' || occasion === 'professional') {
      if (wardrobeItems.length >= 4) {
        combinations.push({
          id: 'professional-1',
          items: [
            wardrobeItems[0], // White T-shirt
            wardrobeItems[1], // Blue Jeans
            wardrobeItems[2], // Black Blazer
            wardrobeItems[3], // White Sneakers
            ],
          summary: 'Smart casual perfection for modern workplaces. The structured blazer transforms casual basics into a polished, professional look that\'s both confident and approachable.',
          confidence: 95,
          occasion: 'Professional',
          weather: weather,
          colorHarmony: 'Classic professional palette - navy, white, and black create authority and trust',
          styleNotes: [
            'The blazer\'s structured shoulders create a powerful silhouette',
            'Dark wash jeans are more formal than light wash - perfect for business casual',
            'White tee keeps the look clean and professional under the blazer',
            'White sneakers add a modern, approachable touch while maintaining polish'
          ],
          fitAdvice: 'Ensure the blazer fits well in the shoulders and sleeves - this is crucial for professional impact',
          whyItWorks: [
            'Blazer instantly elevates any casual pieces to professional level',
            'Dark jeans are more formal than light wash - appropriate for most offices',
            'Clean white tee keeps the look polished and professional',
            'Comfortable enough for a long interview or workday',
            'Shows you understand modern professional dress codes'
          ],
        });
      }
    }

    // Date night outfit combinations
    if (occasion === 'date') {
      if (wardrobeItems.length >= 5) {
        combinations.push({
          id: 'date-1',
          items: [
            wardrobeItems[4], // Black Dress
            this.retailerItems[3], // Leather Ankle Boots
            this.retailerItems[4], // Cashmere Scarf
            ],
          summary: 'Timeless elegance with a bold twist. The classic LBD gets a modern update with Country Road leather boots and cashmere scarf that show confidence and personality.',
          confidence: 98,
          occasion: 'Date Night',
          weather: weather,
          colorHarmony: 'Monochrome base with red accent - creates drama and draws attention to your face',
          styleNotes: [
            'The little black dress creates a slimming, elegant silhouette',
            'Red heels add a bold, confident pop that\'s both sexy and sophisticated',
            'Statement necklace draws attention upward to your face and décolletage',
            'Classic combination that feels special without being overdone'
          ],
          fitAdvice: 'Choose a dress length that flatters your legs - midi or knee-length are most versatile',
          whyItWorks: [
            'Little black dress is universally flattering and always appropriate',
            'Red heels add a bold, confident touch that shows personality',
            'Statement necklace creates a focal point and draws attention to your face',
            'Classic combination that feels special and intentional',
            'Easy to accessorize with different jewelry or bags for variety'
          ],
        });
      }
    }

    // Party outfit combinations
    if (occasion === 'party') {
      if (wardrobeItems.length >= 2) {
        combinations.push({
          id: 'party-1',
          items: [
            wardrobeItems[0], // White T-shirt
            wardrobeItems[1], // Blue Jeans
            this.retailerItems[5], // Denim Jacket
            this.retailerItems[4], // Cashmere Scarf
            ],
          summary: 'Effortlessly cool for a night out. The Country Road denim jacket adds instant edge while the cashmere scarf adds luxury and creates a focal point.',
          confidence: 90,
          occasion: 'Party',
          weather: weather,
          colorHarmony: 'Neutral base with metallic accents - creates depth and catches light',
          styleNotes: [
            'Leather jacket adds instant cool factor and attitude',
            'Statement necklace catches the light and creates movement',
            'Comfortable for dancing and socializing all night',
            'Easy to layer or remove as temperature changes'
          ],
          fitAdvice: 'Choose a leather jacket that fits well in the shoulders - it should feel like a second skin',
          whyItWorks: [
            'Leather jacket adds instant cool factor and edge',
            'Statement necklace catches the light and creates visual interest',
            'Comfortable for dancing and socializing without sacrificing style',
            'Easy to layer or remove as needed throughout the night',
            'Shows you have style without trying too hard'
          ],
        });
      }
    }

    return combinations.slice(0, count);
  }

  // Generate single outfit for instant generation
  static async generateInstantOutfit(weather: string = '22°', userId?: string): Promise<OutfitCombination> {
    const combinations = await this.generateOutfitCombinations('casual', weather, 1, userId);
    return combinations[0] || await this.getDefaultOutfit(userId);
  }

  // Generate event-specific outfit
  static async generateEventOutfit(occasion: string, weather: string = '22°', userId?: string): Promise<OutfitCombination> {
    const combinations = await this.generateOutfitCombinations(occasion, weather, 1, userId);
    return combinations[0] || await this.getDefaultOutfit(userId);
  }

  // Default fallback outfit
  private static async getDefaultOutfit(userId?: string): Promise<OutfitCombination> {
    const wardrobeItems = await this.getRealWardrobeItems(userId);
    return {
      id: 'default',
      items: [
        wardrobeItems[0],
        wardrobeItems[1],
        wardrobeItems[3],
      ],
      summary: 'A timeless combination that works for any occasion. This classic ensemble balances comfort with style, making it perfect for everyday wear.',
      confidence: 85,
      occasion: 'Casual',
      weather: '22°',
      colorHarmony: 'Neutral and versatile - works with any skin tone and hair color',
      styleNotes: [
        'Classic combination that never goes out of style',
        'Comfortable for all-day wear',
        'Easy to accessorize with different pieces'
      ],
      fitAdvice: 'Keep proportions balanced - if the top is loose, consider a more fitted bottom',
      whyItWorks: [
        'Timeless combination that works for any occasion',
        'Comfortable and versatile for all-day wear',
        'Easy to style and accessorize with different pieces',
        'Classic colors that flatter most skin tones',
        'Can be dressed up or down depending on accessories'
      ],
    };
  }

  // Get outfit by ID
  static async getOutfitById(id: string): Promise<OutfitCombination | null> {
    const allCombinations = [
      ...(await this.generateOutfitCombinations('casual', '22°', 3)),
      ...(await this.generateOutfitCombinations('professional', '22°', 2)),
      ...(await this.generateOutfitCombinations('date', '22°', 2)),
      ...(await this.generateOutfitCombinations('party', '22°', 2)),
    ];
    
    return allCombinations.find(outfit => outfit.id === id) || null;
  }
}
