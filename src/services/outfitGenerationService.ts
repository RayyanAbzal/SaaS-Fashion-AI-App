import { 
  OutfitCreationRequest, 
  OutfitGenerationResult, 
  OutfitSuggestion, 
  WardrobeItem, 
  ShoppingItem, 
  Category, 
  Occasion,
  RetailerConfig,
  OccasionConfig,
  ColorHarmony,
  ColorWheelDefinition
} from '../types';
import { getWardrobeItems } from './wardrobeService';
import { WeatherService, WeatherData } from './weatherService';
import ShoppingService from './shoppingService';
import { AuthService } from './authService';
import { FirestoreService } from './firestoreService';

// Color harmony configurations
const COLOR_SCHEMES = {
  monochromatic: ['primary', 'tint', 'shade', 'tone'],
  analogous: ['primary', 'adjacent1', 'adjacent2'],
  complementary: ['primary', 'complement'],
  triadic: ['primary', 'triad1', 'triad2'],
  splitComplementary: ['primary', 'splitComplement1', 'splitComplement2'],
  tetradic: ['primary', 'complement', 'tetrad1', 'tetrad2']
};

const COLOR_WHEEL: ColorWheelDefinition = {
  red: { hue: 0, complementary: 'green', analogous: ['orange', 'purple'] },
  orange: { hue: 30, complementary: 'blue', analogous: ['yellow', 'red'] },
  yellow: { hue: 60, complementary: 'purple', analogous: ['green', 'orange'] },
  green: { hue: 120, complementary: 'red', analogous: ['blue', 'yellow'] },
  blue: { hue: 240, complementary: 'orange', analogous: ['purple', 'green'] },
  purple: { hue: 300, complementary: 'yellow', analogous: ['red', 'blue'] },
  // Neutrals
  black: { hue: 0, complementary: '', analogous: [], isNeutral: true, pairsWithAll: true },
  white: { hue: 0, complementary: '', analogous: [], isNeutral: true, pairsWithAll: true },
  gray: { hue: 0, complementary: '', analogous: [], isNeutral: true, pairsWithAll: true },
  beige: { hue: 0, complementary: '', analogous: [], isNeutral: true, pairsWithAll: true },
  navy: { hue: 0, complementary: '', analogous: [], isNeutral: true, pairsWithAll: true }
};

// Predefined occasions with style guidelines
const OCCASION_CONFIGS: OccasionConfig[] = [
  {
    id: 'casual',
    name: 'Casual',
    description: 'Everyday comfort and style',
    icon: 'shirt-outline',
    styleGuidelines: ['Comfortable', 'Versatile', 'Easy to wear'],
    weatherConsiderations: ['Layer appropriately', 'Consider temperature'],
    colorPalette: ['neutral', 'blue', 'gray', 'white', 'black'],
    formality: 'casual'
  },
  {
    id: 'work',
    name: 'Work',
    description: 'Professional and polished',
    icon: 'briefcase-outline',
    styleGuidelines: ['Professional', 'Polished', 'Appropriate for office'],
    weatherConsiderations: ['Business appropriate', 'Comfortable for long hours'],
    colorPalette: ['navy', 'gray', 'white', 'black', 'beige'],
    formality: 'business'
  },
  {
    id: 'party',
    name: 'Party',
    description: 'Fun and fashionable',
    icon: 'wine-outline',
    styleGuidelines: ['Trendy', 'Eye-catching', 'Confident'],
    weatherConsiderations: ['Consider venue temperature', 'Dance-friendly'],
    colorPalette: ['black', 'red', 'gold', 'silver', 'bold colors'],
    formality: 'party'
  },
  {
    id: 'date',
    name: 'Date',
    description: 'Romantic and attractive',
    icon: 'heart-outline',
    styleGuidelines: ['Attractive', 'Confident', 'Comfortable'],
    weatherConsiderations: ['Appropriate for venue', 'Comfortable for activity'],
    colorPalette: ['navy', 'white', 'black', 'red', 'pastels'],
    formality: 'smart-casual'
  },
  {
    id: 'formal',
    name: 'Formal',
    description: 'Elegant and sophisticated',
    icon: 'tie-outline',
    styleGuidelines: ['Elegant', 'Sophisticated', 'Timeless'],
    weatherConsiderations: ['Formal venue appropriate', 'Comfortable for duration'],
    colorPalette: ['black', 'navy', 'gray', 'white'],
    formality: 'formal'
  }
];

class OutfitGenerationService {
  /**
   * Generate outfits based on selected items and preferences
   */
  static async generateOutfits(request: OutfitCreationRequest): Promise<OutfitGenerationResult> {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Get user's wardrobe and shopping items
      const userWardrobe = await getWardrobeItems();
      
      // Get current weather if requested
      let weather = request.weather;
      if (request.aiPreferences?.considerWeather && !weather) {
        try {
          const location = await WeatherService.getCurrentLocation();
          const currentWeather = await WeatherService.getCurrentWeather(location.coords.latitude, location.coords.longitude);
          weather = currentWeather;
        } catch (error) {
          console.error('Error getting weather:', error);
        }
      }

      // Analyze selected items
      const selectedItemsAnalysis = this.analyzeSelectedItems(request.selectedItems);
      
      // Determine missing categories
      const missingCategories = this.findMissingCategories(request.selectedItems);
      
      // Generate outfit suggestions
      const outfits = await this.createOutfitSuggestions(
        request.selectedItems,
        userWardrobe,
        request,
        weather
      );

      // Analyze color harmony
      const colorHarmony = this.analyzeColorHarmony(request.selectedItems);
      
      // Calculate style compatibility
      const styleCompatibility = this.calculateStyleCompatibility(request.selectedItems, request.occasion, request.stylePreferences);
      
      // Calculate weather appropriateness
      const weatherAppropriateness = weather ? this.calculateWeatherAppropriateness(request.selectedItems, weather) : 0.8;
      
      // Calculate occasion fit
      const occasionFit = this.calculateOccasionFit(request.selectedItems, request.occasion);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        request.selectedItems,
        missingCategories,
        request.occasion,
        weather
      );

      return {
        outfits,
        analysis: {
          selectedItemsAnalysis,
          colorHarmony,
          styleCompatibility,
          weatherAppropriateness,
          occasionFit
        },
        recommendations
      };

    } catch (error) {
      console.error('Error generating outfits:', error);
      throw error;
    }
  }

  /**
   * Analyze selected items for compatibility and style
   */
  private static analyzeSelectedItems(items: WardrobeItem[]): string {
    if (items.length === 0) return 'No items selected';
    
    const categories = items.map(item => item.category);
    const colors = items.map(item => item.color);
    const brands = items.map(item => item.brand);
    
    const uniqueCategories = Array.from(new Set(categories));
    const uniqueColors = Array.from(new Set(colors));
    const uniqueBrands = Array.from(new Set(brands));
    
    let analysis = `Selected ${items.length} items: `;
    analysis += `${uniqueCategories.join(', ')} in ${uniqueColors.join(', ')} colors`;
    
    if (uniqueBrands.length > 1) {
      analysis += ` from ${uniqueBrands.length} different brands`;
    }
    
    return analysis;
  }

  /**
   * Find missing clothing categories for a complete outfit
   */
  private static findMissingCategories(selectedItems: WardrobeItem[]): Category[] {
    const selectedCategories = selectedItems.map(item => item.category);
    const allCategories: Category[] = ['tops', 'bottoms', 'shoes', 'accessories', 'outerwear'];
    
    return allCategories.filter(category => !Array.isArray(selectedCategories) || !selectedCategories.includes(category));
  }

  /**
   * Create outfit suggestions with AI reasoning
   */
  private static async createOutfitSuggestions(
    selectedItems: WardrobeItem[],
    userWardrobe: WardrobeItem[],
    request: OutfitCreationRequest,
    weather?: WeatherData
  ): Promise<OutfitSuggestion[]> {
    const outfits: OutfitSuggestion[] = [];
    const maxOutfits = request.aiPreferences?.maxOutfits || 3;
    
    // Get occasion config
    const occasionConfig = OCCASION_CONFIGS.find(oc => oc.id === request.occasion);
    
    // Filter available items based on preferences
    const availableWardrobeItems = this.filterWardrobeItems(userWardrobe, request);
    
    // Create different outfit combinations
    for (let i = 0; i < maxOutfits; i++) {
      const outfit = await this.createSingleOutfit(
        selectedItems,
        availableWardrobeItems,
        request,
        occasionConfig,
        weather,
        i
      );
      
      if (outfit) {
        outfits.push(outfit);
      }
    }
    
    return outfits;
  }

  /**
   * Create a single outfit suggestion with enhanced personalization
   */
  private static async createSingleOutfit(
    selectedItems: WardrobeItem[],
    availableWardrobeItems: WardrobeItem[],
    request: OutfitCreationRequest,
    occasionConfig: OccasionConfig | undefined,
    weather?: WeatherData,
    outfitIndex: number = 0
  ): Promise<OutfitSuggestion | null> {
    const outfit: (WardrobeItem | ShoppingItem)[] = [...selectedItems];
    const missingCategories = this.findMissingCategories(selectedItems);

    // Try to fill missing categories
    for (const category of missingCategories) {
      let item: WardrobeItem | ShoppingItem | null = null;

      // First try wardrobe items
      if (!request.retailerPreferences?.includeWardrobeOnly) {
        item = this.findBestWardrobeItem(
          availableWardrobeItems,
          category,
          outfit,
          occasionConfig,
          weather,
          request.stylePreferences
        );
      }

      if (item) {
        outfit.push(item);
      }
    }

    if (outfit.length < 2) {
      return null; // Not enough items for a complete outfit
    }

    // Calculate outfit scores
    const colorHarmony = this.analyzeColorHarmony(outfit);
    const styleCompatibility = this.calculateStyleCompatibility(
      outfit.filter(item => 'wearCount' in item) as WardrobeItem[],
      request.occasion,
      request.stylePreferences
    );
    const weatherAppropriateness = weather ? 
      this.calculateWeatherAppropriateness(outfit.filter(item => 'wearCount' in item) as WardrobeItem[], weather) : 
      0.8;

    // Generate outfit reasoning and style notes
    const reasoning = this.generateOutfitReasoning(
      outfit,
      selectedItems,
      occasionConfig,
      weather,
      outfitIndex
    );

    const styleNotes = this.generateStyleNotes(
      outfit,
      occasionConfig,
      request.stylePreferences
    );

    // Calculate confidence score
    const confidence = (
      colorHarmony.score * 0.3 +
      styleCompatibility * 0.4 +
      weatherAppropriateness * 0.3
    );

    return {
      id: `outfit-${Date.now()}-${outfitIndex}`,
      items: outfit,
      reasoning,
      occasion: request.occasion,
      weather: weather ? [weather.condition] : [],
      confidence,
      styleNotes,
      colorHarmony,
      totalPrice: outfit.reduce((sum, item) => {
        if ('price' in item) {
          return sum + item.price;
        }
        return sum;
      }, 0),
      retailerMix: {
        wardrobeItems: outfit.filter(item => 'wearCount' in item).length,
        shoppingItems: outfit.filter(item => 'price' in item).length,
        retailers: Array.from(new Set(outfit.map(item => 
          'brand' in item ? item.brand : (item as ShoppingItem).retailer?.name || 'Unknown'
        )))
      }
    };
  }

  /**
   * Find the best wardrobe item for a category
   */
  private static findBestWardrobeItem(
    availableItems: WardrobeItem[],
    category: Category,
    currentOutfit: (WardrobeItem | ShoppingItem)[],
    occasionConfig?: OccasionConfig,
    weather?: WeatherData,
    stylePreferences?: string[]
  ): WardrobeItem | null {
    const categoryItems = availableItems.filter(item => item.category === category);
    
    if (categoryItems.length === 0) return null;
    
    // Score items based on compatibility
    const scoredItems = categoryItems.map(item => ({
      item,
      score: this.calculateItemCompatibilityScore(item, currentOutfit, occasionConfig, weather, stylePreferences)
    }));
    
    // Return the highest scoring item
    scoredItems.sort((a, b) => b.score - a.score);
    return scoredItems[0]?.item || null;
  }

  /**
   * Type guard for WardrobeItem
   */
  private static isWardrobeItem(item: WardrobeItem | ShoppingItem): item is WardrobeItem {
    return 'wearCount' in item && 'tags' in item;
  }

  /**
   * Calculate item compatibility score
   */
  private static calculateItemCompatibilityScore(
    item: WardrobeItem | ShoppingItem,
    currentOutfit: (WardrobeItem | ShoppingItem)[],
    occasionConfig?: OccasionConfig,
    weather?: WeatherData,
    stylePreferences?: string[]
  ): number {
    let score = 0.5; // Base score

    // Color compatibility
    const colorHarmony = this.analyzeColorHarmony([...currentOutfit, item]);
    score += colorHarmony.score * 0.3;

    // Occasion compatibility
    if (occasionConfig && this.isWardrobeItem(item)) {
      const matchingGuidelines = occasionConfig.styleGuidelines.filter(guideline =>
        item.tags.some(tag => tag.toLowerCase().includes(guideline.toLowerCase()))
      );
      score += (matchingGuidelines.length * 0.1);
    }

    // Weather compatibility
    if (weather && this.isWardrobeItem(item) && item.weatherCompatibility) {
      // Temperature check
      if (weather.temperature >= item.weatherCompatibility.temperatureRange.min &&
          weather.temperature <= item.weatherCompatibility.temperatureRange.max) {
        score += 0.2;
      }

      // Weather conditions check
      if (Array.isArray(item.weatherCompatibility.weatherConditions) && item.weatherCompatibility.weatherConditions.includes(weather.condition.toLowerCase())) {
        score += 0.1;
      }
    }

    // Style compatibility
    if (stylePreferences && stylePreferences.length > 0 && this.isWardrobeItem(item)) {
      const matchingPreferences = stylePreferences.filter(pref =>
        item.tags.some(tag => tag.toLowerCase().includes(pref.toLowerCase()))
      );
      score += (matchingPreferences.length * 0.15);
    }

    return Math.min(score, 1.0);
  }

  /**
   * Check if colors are complementary
   */
  private static areColorsComplementary(color: string, outfitColors: string[]): boolean {
    const complementaryPairs = [
      ['red', 'green'],
      ['blue', 'orange'],
      ['yellow', 'purple'],
      ['black', 'white'],
      ['navy', 'beige'],
      ['gray', 'white']
    ];
    
    return outfitColors.some(outfitColor => 
      complementaryPairs.some(pair => 
        pair.includes(color.toLowerCase()) && pair.includes(outfitColor.toLowerCase())
      )
    );
  }

  /**
   * Generate outfit reasoning
   */
  private static generateOutfitReasoning(
    outfitItems: (WardrobeItem | ShoppingItem)[],
    selectedItems: WardrobeItem[],
    occasionConfig?: OccasionConfig,
    weather?: WeatherData,
    outfitIndex: number = 0
  ): string {
    const newItems = outfitItems.filter(item => !selectedItems.some(selected => selected.id === item.id));
    const occasionName = occasionConfig?.name || 'this occasion';
    
    let reasoning = `Perfect for ${occasionName}! `;
    
    if (newItems.length > 0) {
      const newItemNames = newItems.map(item => item.name).join(', ');
      reasoning += `I've added ${newItemNames} to complement your selected items. `;
    }
    
    if (weather) {
      reasoning += `This outfit works great for ${weather.condition} weather. `;
    }
    
    const colors = Array.from(new Set(outfitItems.map(item => item.color)));
    if (colors.length > 1) {
      reasoning += `The ${colors.join(' and ')} color combination creates a balanced look.`;
    }
    
    return reasoning;
  }

  /**
   * Calculate outfit confidence score
   */
  private static calculateOutfitConfidence(
    outfitItems: (WardrobeItem | ShoppingItem)[],
    occasionConfig?: OccasionConfig,
    weather?: WeatherData
  ): number {
    let confidence = 0.5;
    
    // More items = higher confidence
    confidence += Math.min(outfitItems.length * 0.1, 0.3);
    
    // Color harmony
    const colors = outfitItems.map(item => item.color);
    const uniqueColors = Array.from(new Set(colors));
    if (uniqueColors.length <= 3) {
      confidence += 0.2;
    }
    
    // Occasion fit
    if (occasionConfig) {
      const matchingColors = colors.filter(color => 
        occasionConfig.colorPalette.includes(color)
      );
      confidence += (matchingColors.length / colors.length) * 0.2;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Generate style notes
   */
  private static generateStyleNotes(
    outfitItems: (WardrobeItem | ShoppingItem)[],
    occasionConfig?: OccasionConfig,
    stylePreferences?: string[]
  ): string[] {
    const notes: string[] = [];
    
    const categories = outfitItems.map(item => item.category);
    if (Array.isArray(categories) && categories.includes('tops') && categories.includes('bottoms')) {
      notes.push('Complete top and bottom combination');
    }
    
    if (Array.isArray(categories) && categories.includes('shoes')) {
      notes.push('Footwear included for complete look');
    }
    
    if (occasionConfig) {
      notes.push(`Perfect for ${occasionConfig.name.toLowerCase()} occasions`);
    }
    
    const colors = outfitItems.map(item => item.color);
    const uniqueColors = Array.from(new Set(colors));
    if (uniqueColors.length === 2) {
      notes.push('Two-tone color scheme');
    } else if (uniqueColors.length === 1) {
      notes.push('Monochromatic look');
    }
    
    if (stylePreferences && stylePreferences.length > 0) {
      notes.push('Style preferences personalization');
    }
    
    return notes;
  }

  /**
   * Enhanced color harmony analysis
   */
  private static analyzeColorHarmony(items: (WardrobeItem | ShoppingItem)[]): ColorHarmony {
    const colors = items.map(item => item.color.toLowerCase());
    
    // Count color occurrences
    const colorCount = colors.reduce((acc, color) => {
      acc[color] = (acc[color] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Find dominant color
    const dominantColor = Object.entries(colorCount)
      .sort(([,a], [,b]) => b - a)[0][0];

    // Check if colors form a known harmony scheme
    let harmonyScheme: ColorHarmony['scheme'] = 'none';
    let harmonyScore = 0;

    // Check for monochromatic scheme
    const isMonochromatic = colors.every(color => {
      const baseColor = this.getBaseColor(color);
      return baseColor === this.getBaseColor(dominantColor) || 
             COLOR_WHEEL[color as keyof typeof COLOR_WHEEL]?.isNeutral;
    });

    // Check for complementary scheme
    const hasComplementaryPair = colors.some(color => {
      const wheelColor = COLOR_WHEEL[color as keyof typeof COLOR_WHEEL];
      return wheelColor && !wheelColor.isNeutral && 
             colors.includes(wheelColor.complementary);
    });

    // Check for analogous scheme
    const hasAnalogousPair = colors.some(color => {
      const wheelColor = COLOR_WHEEL[color as keyof typeof COLOR_WHEEL];
      return wheelColor && !wheelColor.isNeutral && 
             wheelColor.analogous.some(analogous => colors.includes(analogous));
    });

    // Determine harmony scheme and score
    if (isMonochromatic) {
      harmonyScheme = 'monochromatic';
      harmonyScore = 0.9;
    } else if (hasComplementaryPair) {
      harmonyScheme = 'complementary';
      harmonyScore = 0.85;
    } else if (hasAnalogousPair) {
      harmonyScheme = 'analogous';
      harmonyScore = 0.8;
    } else {
      // Check if colors at least work together
      const neutralCount = colors.filter(color => 
        COLOR_WHEEL[color as keyof typeof COLOR_WHEEL]?.isNeutral
      ).length;
      
      harmonyScore = neutralCount > 0 ? 0.7 : 0.5;
    }

    // Generate style tips based on harmony analysis
    const styleTips = this.generateColorStyleTips(
      colors,
      harmonyScheme,
      dominantColor
    );

    return {
      scheme: harmonyScheme,
      score: harmonyScore,
      dominantColor,
      styleTips
    };
  }

  /**
   * Get base color by removing variations (light, dark, etc.)
   */
  private static getBaseColor(color: string): string {
    const baseColors = Object.keys(COLOR_WHEEL);
    return baseColors.find(base => color.includes(base)) || color;
  }

  /**
   * Generate style tips based on color analysis
   */
  private static generateColorStyleTips(
    colors: string[],
    harmonyScheme: string,
    dominantColor: string
  ): string[] {
    const tips: string[] = [];

    switch (harmonyScheme) {
      case 'monochromatic':
        tips.push(
          `Great use of ${dominantColor} tones for a sophisticated look.`,
          'Try adding a contrasting accessory for visual interest.'
        );
        break;
      case 'complementary':
        tips.push(
          'Bold complementary color combination!',
          'Consider adding neutral pieces to balance the look.'
        );
        break;
      case 'analogous':
        tips.push(
          'Harmonious color combination with similar tones.',
          'Add metallic accessories to enhance the palette.'
        );
        break;
      default:
        if (colors.some(c => COLOR_WHEEL[c as keyof typeof COLOR_WHEEL]?.isNeutral)) {
          tips.push(
            'Good use of neutral colors as a base.',
            'Consider adding one bold color piece for accent.'
          );
        } else {
          tips.push(
            'Consider incorporating neutral pieces to tie the look together.',
            'Try limiting bold colors to one or two statement pieces.'
          );
        }
    }

    return tips;
  }

  /**
   * Calculate weather appropriateness with enhanced scoring
   */
  private static calculateWeatherAppropriateness(items: WardrobeItem[], weather: WeatherData): number {
    if (!weather) return 0.8; // Default score if no weather data

    let score = 1.0;
    const temp = weather.temperature;
    const condition = weather.condition.toLowerCase();
    const isRaining = condition.includes('rain');
    const isSnowing = condition.includes('snow');
    const isHot = temp > 25;
    const isCold = temp < 10;

    for (const item of items) {
      // Temperature appropriateness
      if (item.weatherCompatibility) {
        const { temperatureRange } = item.weatherCompatibility;
        if (temp < temperatureRange.min || temp > temperatureRange.max) {
          score -= 0.2;
        }
      }

      // Weather condition appropriateness
      if (isRaining && !item.weatherCompatibility?.weatherConditions.includes('rain')) {
        score -= 0.15;
      }
      if (isSnowing && !item.weatherCompatibility?.weatherConditions.includes('snow')) {
        score -= 0.15;
      }

      // Layer appropriateness
      const isOuterwear = item.category === 'outerwear';
      if (isHot && isOuterwear) {
        score -= 0.1;
      }
      if (isCold && !isOuterwear && item.category === 'tops') {
        score -= 0.1;
      }
    }

    // UV protection consideration
    if (weather.uv > 7) {
      const hasUVProtection = items.some(item => 
        item.category === 'accessories' && 
        item.tags && (Array.isArray(item.tags) && (item.tags.includes('sun-protection') || item.tags.includes('hat')))
      );
      if (!hasUVProtection) {
        score -= 0.1;
      }
    }

    return Math.max(0.1, Math.min(1, score));
  }

  /**
   * Calculate style compatibility with enhanced personalization
   */
  private static calculateStyleCompatibility(
    items: WardrobeItem[], 
    occasion: Occasion,
    stylePreferences?: string[]
  ): number {
    let score = 1.0;
    const occasionConfig = OCCASION_CONFIGS.find(oc => oc.id === occasion);

    // Base compatibility with occasion
    if (occasionConfig) {
      for (const item of items) {
        // Check if item tags match occasion style guidelines
        const matchingGuidelines = occasionConfig.styleGuidelines.filter(guideline =>
          item.tags.some(tag => tag.toLowerCase().includes(guideline.toLowerCase()))
        );
        score += (matchingGuidelines.length * 0.1);

        // Check formality match
        if (Array.isArray(item.tags) && item.tags.includes(occasionConfig.formality)) {
          score += 0.1;
        }
      }
    }

    // Style preferences personalization
    if (stylePreferences && stylePreferences.length > 0) {
      for (const item of items) {
        const matchingPreferences = stylePreferences.filter(pref =>
          item.tags.some(tag => tag.toLowerCase().includes(pref.toLowerCase()))
        );
        score += (matchingPreferences.length * 0.15);
      }
    }

    // Brand cohesion
    const brands = new Set(items.map(item => item.brand));
    if (brands.size === 1) {
      score += 0.1; // Perfect brand match
    } else if (brands.size === 2) {
      score += 0.05; // Good brand coordination
    }

    // Style consistency
    const styles = items.flatMap(item => 
      item.tags.filter(tag => 
        ['casual', 'formal', 'sporty', 'elegant', 'bohemian', 'minimalist'].includes(tag)
      )
    );
    const uniqueStyles = new Set(styles);
    if (uniqueStyles.size === 1) {
      score += 0.1; // Perfect style consistency
    } else if (uniqueStyles.size === 2) {
      score += 0.05; // Acceptable style mix
    }

    return Math.max(0.1, Math.min(1, score / 2)); // Normalize to 0.1-1.0 range
  }

  /**
   * Calculate occasion fit
   */
  private static calculateOccasionFit(items: WardrobeItem[], occasion: Occasion): number {
    const occasionConfig = OCCASION_CONFIGS.find(oc => oc.id === occasion);
    if (!occasionConfig) return 0.5;
    
    let fit = 0.5;
    
    // Check if items have appropriate tags for the occasion
    const appropriateItems = items.filter(item => 
      item.tags?.some(tag => 
        occasionConfig.styleGuidelines.some(guideline => 
          tag.toLowerCase().includes(guideline.toLowerCase())
        )
      )
    );
    
    fit += (appropriateItems.length / items.length) * 0.5;
    
    return Math.min(fit, 1.0);
  }

  /**
   * Generate recommendations
   */
  private static generateRecommendations(
    selectedItems: WardrobeItem[],
    missingCategories: Category[],
    occasion: Occasion,
    weather?: any
  ): {
    missingCategories: Category[];
    suggestedColors: string[];
    styleTips: string[];
  } {
    const occasionConfig = OCCASION_CONFIGS.find(oc => oc.id === occasion);
    
    const suggestedColors = occasionConfig?.colorPalette || ['neutral', 'blue', 'black'];
    
    const styleTips: string[] = [];
    
    if (Array.isArray(missingCategories) && missingCategories.includes('shoes')) {
      styleTips.push('Add footwear to complete your look');
    }
    
    if (Array.isArray(missingCategories) && missingCategories.includes('accessories')) {
      styleTips.push('Consider adding accessories for extra style');
    }
    
    if (weather) {
      styleTips.push(`Dress appropriately for ${weather.condition} weather`);
    }
    
    if (occasionConfig) {
      styleTips.push(`Keep it ${occasionConfig.formality} for ${occasionConfig.name.toLowerCase()} occasions`);
    }
    
    return {
      missingCategories,
      suggestedColors,
      styleTips
    };
  }

  /**
   * Filter wardrobe items based on preferences
   */
  private static filterWardrobeItems(wardrobe: WardrobeItem[], request: OutfitCreationRequest): WardrobeItem[] {
    return wardrobe.filter(item => {
      // Filter out already selected items
      if (request.selectedItems.some(selected => selected.id === item.id)) {
        return false;
      }
      
      // Filter by budget if specified
      if (request.budget && 'purchaseInfo' in item && item.purchaseInfo) {
        const price = item.purchaseInfo.price;
        if (price < request.budget.min || price > request.budget.max) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Get available occasions
   */
  static getAvailableOccasions(): OccasionConfig[] {
    return OCCASION_CONFIGS;
  }
}

export default OutfitGenerationService; 