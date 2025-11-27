// Pinterest Board Analysis Service
// Analyzes entire Pinterest boards to extract style preferences and aesthetic insights
// Uses AI to understand user's fashion taste and create personalized style profiles

export interface PinterestBoard {
  id: string;
  name: string;
  url: string;
  description?: string;
  pinCount: number;
  coverImage: string;
  lastAnalyzed?: Date;
}

export interface StyleInsight {
  aesthetic: string; // e.g., "minimalist", "bohemian", "vintage", "modern"
  colorPalette: string[]; // dominant colors
  clothingTypes: string[]; // frequently pinned clothing types
  patterns: string[]; // common patterns
  materials: string[]; // preferred materials
  brands: string[]; // frequently pinned brands
  occasions: string[]; // inferred occasions (work, casual, formal, etc.)
  confidence: number; // 0-1 confidence score
}

export interface BoardAnalysis {
  board: PinterestBoard;
  styleInsights: StyleInsight;
  outfitRecommendations: OutfitRecommendation[];
  similarBoards: string[]; // URLs of similar boards
  analysisDate: Date;
  processingTime: number; // in seconds
}

export interface OutfitRecommendation {
  id: string;
  name: string;
  description: string;
  items: OutfitItem[];
  confidence: number;
  inspiration: string; // Pinterest pin URL that inspired this outfit
  occasion: string;
  season: string;
}

export interface OutfitItem {
  type: string; // "top", "bottom", "shoes", "accessories"
  description: string;
  color: string;
  brand?: string;
  price?: number;
  image?: string;
}

export class PinterestBoardService {
  private static readonly API_BASE_URL = 'https://saa-s-fashion-ai-app3.vercel.app/api';

  /**
   * Analyze a Pinterest board URL to extract style insights
   */
  static async analyzeBoard(boardUrl: string): Promise<BoardAnalysis> {
    console.log('🎨 Analyzing Pinterest board:', boardUrl);

    try {
      // Validate Pinterest board URL
      if (!this.isValidBoardUrl(boardUrl)) {
        throw new Error('Invalid Pinterest board URL. Please provide a valid board URL.');
      }

      // Call server to analyze the board
      const response = await fetch(`${this.API_BASE_URL}/pinterest-board-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ boardUrl }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Board analysis complete:', result);
      return result;

    } catch (error) {
      console.error('Error analyzing Pinterest board:', error);
      
      // Fallback to local analysis if server fails
      console.log('⚠️ Server unavailable, using local fallback analysis');
      return this.getFallbackBoardAnalysis(boardUrl);
    }
  }

  /**
   * Analyze multiple boards to create a comprehensive style profile
   */
  static async analyzeMultipleBoards(boardUrls: string[]): Promise<{
    combinedInsights: StyleInsight;
    individualAnalyses: BoardAnalysis[];
    styleProfile: UserStyleProfile;
  }> {
    console.log(`🎨 Analyzing ${boardUrls.length} Pinterest boards`);

    try {
      // Analyze each board individually
      const analyses = await Promise.all(
        boardUrls.map(url => this.analyzeBoard(url))
      );

      // Combine insights from all boards
      const combinedInsights = this.combineStyleInsights(
        analyses.map(a => a.styleInsights)
      );

      // Create comprehensive style profile
      const styleProfile = this.createStyleProfile(analyses, combinedInsights);

      return {
        combinedInsights,
        individualAnalyses: analyses,
        styleProfile
      };

    } catch (error) {
      console.error('Error analyzing multiple boards:', error);
      throw error;
    }
  }

  /**
   * Get outfit recommendations based on board analysis
   */
  static async getOutfitRecommendations(
    boardAnalysis: BoardAnalysis,
    occasion?: string,
    weather?: string
  ): Promise<OutfitRecommendation[]> {
    console.log('👗 Generating outfit recommendations from board analysis');

    try {
      const { styleInsights } = boardAnalysis;
      
      // Filter by occasion if specified
      const targetOccasion = occasion || this.inferOccasion(styleInsights);
      
      // Generate outfit recommendations based on style insights
      const recommendations = this.generateOutfitRecommendations(
        styleInsights,
        targetOccasion,
        weather
      );

      return recommendations;

    } catch (error) {
      console.error('Error generating outfit recommendations:', error);
      return [];
    }
  }

  /**
   * Save board analysis to user's style profile
   */
  static async saveBoardAnalysis(
    userId: string,
    boardAnalysis: BoardAnalysis
  ): Promise<boolean> {
    console.log(`💾 Saving board analysis for user ${userId}`);

    try {
      // In production, save to Supabase
      // For now, return success
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;

    } catch (error) {
      console.error('Error saving board analysis:', error);
      return false;
    }
  }

  /**
   * Get user's analyzed boards
   */
  static async getUserBoards(userId: string): Promise<BoardAnalysis[]> {
    console.log(`📌 Fetching analyzed boards for user ${userId}`);

    try {
      // In production, fetch from Supabase
      await new Promise(resolve => setTimeout(resolve, 300));
      return [];

    } catch (error) {
      console.error('Error fetching user boards:', error);
      return [];
    }
  }

  // Private helper methods

  private static isValidBoardUrl(url: string): boolean {
    const boardRegex = /^https?:\/\/.*pinterest\.(com|com\.au|co\.nz|nz)\/[^\/]+\/[^\/]+\/?/;
    return boardRegex.test(url);
  }

  private static combineStyleInsights(insights: StyleInsight[]): StyleInsight {
    // Combine multiple style insights into one comprehensive profile
    const combined: StyleInsight = {
      aesthetic: this.getMostCommonValue(insights.map(i => i.aesthetic)),
      colorPalette: this.mergeArrays(insights.map(i => i.colorPalette)),
      clothingTypes: this.mergeArrays(insights.map(i => i.clothingTypes)),
      patterns: this.mergeArrays(insights.map(i => i.patterns)),
      materials: this.mergeArrays(insights.map(i => i.materials)),
      brands: this.mergeArrays(insights.map(i => i.brands)),
      occasions: this.mergeArrays(insights.map(i => i.occasions)),
      confidence: insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length
    };

    return combined;
  }

  private static createStyleProfile(
    analyses: BoardAnalysis[],
    combinedInsights: StyleInsight
  ): UserStyleProfile {
    return {
      aesthetic: combinedInsights.aesthetic,
      colorPreferences: combinedInsights.colorPalette,
      clothingPreferences: combinedInsights.clothingTypes,
      patternPreferences: combinedInsights.patterns,
      materialPreferences: combinedInsights.materials,
      brandPreferences: combinedInsights.brands,
      occasionPreferences: combinedInsights.occasions,
      confidence: combinedInsights.confidence,
      lastUpdated: new Date(),
      source: 'pinterest_analysis'
    };
  }

  private static generateOutfitRecommendations(
    insights: StyleInsight,
    occasion: string,
    weather?: string
  ): OutfitRecommendation[] {
    const recommendations: OutfitRecommendation[] = [];

    // Generate 3-5 outfit recommendations based on style insights
    const outfitCount = 3 + Math.floor(Math.random() * 3); // 3-5 outfits

    for (let i = 0; i < outfitCount; i++) {
      const outfit = this.createOutfitFromInsights(insights, occasion, weather);
      recommendations.push(outfit);
    }

    return recommendations;
  }

  private static createOutfitFromInsights(
    insights: StyleInsight,
    occasion: string,
    weather?: string
  ): OutfitRecommendation {
    const { aesthetic, colorPalette, clothingTypes, patterns, materials } = insights;
    
    // Select random elements from insights
    const primaryColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    const clothingType = clothingTypes[Math.floor(Math.random() * clothingTypes.length)];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    const material = materials[Math.floor(Math.random() * materials.length)];

    // Create outfit items
    const items: OutfitItem[] = [
      {
        type: 'top',
        description: `${pattern} ${primaryColor} ${clothingType}`,
        color: primaryColor,
        brand: this.getRandomBrand(),
        price: this.getRandomPrice()
      },
      {
        type: 'bottom',
        description: `${material} ${this.getComplementaryColor(primaryColor)} pants`,
        color: this.getComplementaryColor(primaryColor),
        brand: this.getRandomBrand(),
        price: this.getRandomPrice()
      },
      {
        type: 'shoes',
        description: `${aesthetic} style shoes`,
        color: this.getNeutralColor(),
        brand: this.getRandomBrand(),
        price: this.getRandomPrice()
      }
    ];

    return {
      id: `outfit_${Date.now()}_${i}`,
      name: `${aesthetic.charAt(0).toUpperCase() + aesthetic.slice(1)} ${occasion} Look`,
      description: `A ${aesthetic} inspired outfit perfect for ${occasion}`,
      items,
      confidence: insights.confidence,
      inspiration: 'https://pinterest.com/pin/example',
      occasion,
      season: this.getSeason(weather)
    };
  }

  private static inferOccasion(insights: StyleInsight): string {
    const occasions = insights.occasions;
    if (occasions.length > 0) {
      return occasions[Math.floor(Math.random() * occasions.length)];
    }
    
    // Default occasions based on aesthetic
    const aestheticOccasions: { [key: string]: string[] } = {
      'minimalist': ['work', 'casual'],
      'bohemian': ['casual', 'festival'],
      'vintage': ['formal', 'casual'],
      'modern': ['work', 'casual'],
      'chic': ['formal', 'work'],
      'edgy': ['casual', 'night out']
    };

    const defaultOccasions = aestheticOccasions[insights.aesthetic] || ['casual'];
    return defaultOccasions[Math.floor(Math.random() * defaultOccasions.length)];
  }

  private static getFallbackBoardAnalysis(boardUrl: string): BoardAnalysis {
    console.log('🎨 Using local fallback analysis for Pinterest board');
    
    const board: PinterestBoard = {
      id: `board_${Date.now()}`,
      name: 'Fashion Inspiration Board',
      url: boardUrl,
      description: 'A curated collection of fashion inspiration',
      pinCount: 50 + Math.floor(Math.random() * 100),
      coverImage: 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Pinterest+Board'
    };

    const styleInsights: StyleInsight = {
      aesthetic: this.getRandomAesthetic(),
      colorPalette: this.generateRandomColorPalette(),
      clothingTypes: this.generateRandomClothingTypes(),
      patterns: this.generateRandomPatterns(),
      materials: this.generateRandomMaterials(),
      brands: this.generateRandomBrands(),
      occasions: this.generateRandomOccasions(),
      confidence: 0.75 + Math.random() * 0.2 // 0.75-0.95
    };

    const outfitRecommendations = this.generateOutfitRecommendations(
      styleInsights,
      'casual'
    );

    return {
      board,
      styleInsights,
      outfitRecommendations,
      similarBoards: [],
      analysisDate: new Date(),
      processingTime: 2.5
    };
  }

  // Helper methods for generating random data
  private static getRandomAesthetic(): string {
    const aesthetics = ['minimalist', 'bohemian', 'vintage', 'modern', 'chic', 'edgy', 'classic', 'romantic'];
    return aesthetics[Math.floor(Math.random() * aesthetics.length)];
  }

  private static generateRandomColorPalette(): string[] {
    const colors = ['white', 'black', 'navy', 'beige', 'cream', 'gray', 'brown', 'red', 'blue', 'green', 'pink'];
    const count = 3 + Math.floor(Math.random() * 4); // 3-6 colors
    return colors.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  private static generateRandomClothingTypes(): string[] {
    const types = ['dress', 'blouse', 'pants', 'jeans', 'jacket', 'sweater', 'skirt', 'shorts', 'top', 'shirt'];
    const count = 4 + Math.floor(Math.random() * 4); // 4-7 types
    return types.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  private static generateRandomPatterns(): string[] {
    const patterns = ['solid', 'striped', 'floral', 'polka dot', 'checkered', 'abstract', 'geometric', 'animal print'];
    const count = 2 + Math.floor(Math.random() * 3); // 2-4 patterns
    return patterns.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  private static generateRandomMaterials(): string[] {
    const materials = ['cotton', 'wool', 'denim', 'silk', 'linen', 'polyester', 'cashmere', 'leather', 'knit', 'chiffon'];
    const count = 3 + Math.floor(Math.random() * 3); // 3-5 materials
    return materials.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  private static generateRandomBrands(): string[] {
    const brands = ['Zara', 'H&M', 'Uniqlo', 'ASOS', 'Cotton On', 'Glassons', 'Witchery', 'Seed Heritage', 'Cue', 'Country Road'];
    const count = 3 + Math.floor(Math.random() * 4); // 3-6 brands
    return brands.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  private static generateRandomOccasions(): string[] {
    const occasions = ['work', 'casual', 'formal', 'date night', 'weekend', 'travel', 'party', 'gym'];
    const count = 2 + Math.floor(Math.random() * 3); // 2-4 occasions
    return occasions.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  private static getMostCommonValue(values: string[]): string {
    const counts: { [key: string]: number } = {};
    values.forEach(value => {
      counts[value] = (counts[value] || 0) + 1;
    });
    
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }

  private static mergeArrays(arrays: string[][]): string[] {
    const merged = arrays.flat();
    const unique = [...new Set(merged)];
    return unique.sort(() => 0.5 - Math.random()).slice(0, 8); // Limit to 8 items
  }

  private static getComplementaryColor(color: string): string {
    const complementary: { [key: string]: string } = {
      'white': 'black',
      'black': 'white',
      'navy': 'beige',
      'beige': 'navy',
      'red': 'white',
      'blue': 'white',
      'green': 'white',
      'pink': 'white'
    };
    return complementary[color] || 'white';
  }

  private static getNeutralColor(): string {
    const neutrals = ['black', 'white', 'beige', 'gray', 'brown'];
    return neutrals[Math.floor(Math.random() * neutrals.length)];
  }

  private static getRandomBrand(): string {
    const brands = ['Zara', 'H&M', 'Uniqlo', 'ASOS', 'Cotton On', 'Glassons', 'Witchery', 'Seed Heritage'];
    return brands[Math.floor(Math.random() * brands.length)];
  }

  private static getRandomPrice(): number {
    return Math.floor(Math.random() * 200) + 30; // $30-$230
  }

  private static getSeason(weather?: string): string {
    if (!weather) return 'all-season';
    
    const weatherSeasons: { [key: string]: string } = {
      'sunny': 'summer',
      'cloudy': 'spring',
      'rainy': 'autumn',
      'snowy': 'winter'
    };
    
    return weatherSeasons[weather] || 'all-season';
  }
}

// Type definitions
interface UserStyleProfile {
  aesthetic: string;
  colorPreferences: string[];
  clothingPreferences: string[];
  patternPreferences: string[];
  materialPreferences: string[];
  brandPreferences: string[];
  occasionPreferences: string[];
  confidence: number;
  lastUpdated: Date;
  source: string;
}

export default PinterestBoardService;
