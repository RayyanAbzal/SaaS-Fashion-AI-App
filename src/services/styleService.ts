import { WardrobeItem, OutfitSuggestion, User, SwipeHistory, Category } from '../types';
import { WeatherData } from './weatherService';
import { FirestoreService } from './firestoreService';
import { WeatherService } from './weatherService';
import { getWardrobeItems } from './wardrobeService';
import { AuthService } from './authService';

// --- Helper Functions ---

const shuffleArray = <T>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const getComplementaryColor = (color: string): string => {
    const colorMap: { [key: string]: string } = {
        'red': 'green', 'green': 'red',
        'blue': 'orange', 'orange': 'blue',
        'yellow': 'purple', 'purple': 'yellow',
        'black': 'white', 'white': 'black', 'gray': 'black'
    };
    return colorMap[color.toLowerCase()] || 'white';
};

const isNeutral = (color: string): boolean => {
    return ['black', 'white', 'gray', 'beige', 'navy', 'brown'].includes(color.toLowerCase());
};

// --- Duplicate Prevention Functions ---

const createOutfitSignature = (items: WardrobeItem[]): string => {
    // Create a unique signature for an outfit combination
    const sortedItems = items
        .map(item => item.id)
        .sort()
        .join('-');
    return sortedItems;
};

const getPreviouslyShownOutfits = (swipeHistory: SwipeHistory[]): Set<string> => {
    // Extract outfit signatures from swipe history
    const shownOutfits = new Set<string>();
    
    swipeHistory.forEach(swipe => {
        // If the swipe has outfit data, extract the signature
        if (swipe.context && swipe.context.outfitSignature) {
            shownOutfits.add(swipe.context.outfitSignature);
        }
    });
    
    return shownOutfits;
};

const filterDuplicateOutfits = (
    potentialOutfits: (WardrobeItem | any)[][],
    previouslyShown: Set<string>
): (WardrobeItem | any)[][] => {
    return potentialOutfits.filter(outfit => {
        const signature = createOutfitSignature(outfit);
        return !previouslyShown.has(signature);
    });
};

// --- Scoring Functions ---

const scoreColorHarmony = (itemA: WardrobeItem, itemB: WardrobeItem): number => {
    const colorA = itemA.color.toLowerCase();
    const colorB = itemB.color.toLowerCase();
    
    if (isNeutral(colorA) || isNeutral(colorB)) return 1.0; // Neutrals go with everything
    if (getComplementaryColor(colorA) === colorB) return 0.8; // Complementary colors are a good match
    if (colorA === colorB) return 0.6; // Monochromatic is okay

    return 0.2;
};

const scoreStyleMatch = (itemA: WardrobeItem, itemB: WardrobeItem): number => {
    const tagsA = itemA.tags || [];
    const tagsB = itemB.tags || [];
    const commonTags = tagsA.filter(tag => tagsB.includes(tag));
    
    const styleKeywords = ['casual', 'formal', 'streetwear', 'vintage', 'edgy', 'bohemian', 'sporty'];
    const hasCommonStyle = commonTags.some(tag => styleKeywords.includes(tag));

    return hasCommonStyle ? 1.0 : commonTags.length > 0 ? 0.7 : 0.3;
};

const scoreWeatherAppropriateness = (outfit: (WardrobeItem | any)[], weather: WeatherData): number => {
    const temp = weather.temperature;
    let totalScore = 0;
    let itemCount = 0;
    let hasInappropriateItem = false;

    // Evaluate the outfit as a whole for weather appropriateness
    const hasShorts = outfit.some(item => 
        item.category === 'bottoms' && 
        item.name?.toLowerCase().includes('short')
    );
    
    const hasShortSleeves = outfit.some(item => 
        item.category === 'tops' && 
        (item.name?.toLowerCase().includes('short sleeve') || item.name?.toLowerCase().includes('tank'))
    );
    
    const hasOuterwear = outfit.some(item => item.category === 'outerwear');
    const hasLongSleeves = outfit.some(item => 
        item.category === 'tops' && 
        item.name?.toLowerCase().includes('sleeve') && 
        !item.name?.toLowerCase().includes('short sleeve')
    );

    // Cold weather evaluation (below 15°C)
    if (temp < 15) {
        if (hasShorts) {
            hasInappropriateItem = true;
            totalScore += 0.2;
        } else {
            totalScore += 0.9;
        }
        
        if (hasShortSleeves && !hasOuterwear) {
            hasInappropriateItem = true;
            totalScore += 0.3;
        } else if (hasLongSleeves || hasOuterwear) {
            totalScore += 0.9;
        } else {
            totalScore += 0.6;
        }
        
        if (hasOuterwear) {
            totalScore += 0.9;
        }
    }
    // Warm weather evaluation (above 20°C)
    else if (temp > 20) {
        if (hasShorts) {
            totalScore += 0.8;
        } else {
            totalScore += 0.6;
        }
        
        if (hasShortSleeves) {
            totalScore += 0.8;
        } else {
            totalScore += 0.5;
        }
        
        if (hasOuterwear) {
            totalScore += 0.3;
        }
    }
    // Moderate weather evaluation (15-20°C)
    else {
        if (hasShorts) {
            totalScore += 0.5;
        } else {
            totalScore += 0.7;
        }
        
        if (hasShortSleeves) {
            totalScore += 0.6;
        } else {
            totalScore += 0.7;
        }
        
        if (hasOuterwear) {
            totalScore += 0.6;
        }
    }
    
    itemCount = outfit.length;
    const finalScore = itemCount > 0 ? totalScore / itemCount : 0.5;
    
    return finalScore;
};

// Helper function for color harmony scoring - now evaluates entire outfit
const getColorHarmonyScore = (outfit: (WardrobeItem | any)[]): number => {
    if (outfit.length < 2) return 0.5;
  
    const colors = outfit.map(item => item.color?.toLowerCase()).filter(Boolean);
    if (colors.length < 2) return 0.5;
    
    // Check for neutral-heavy outfit (good coordination)
    const neutrals = ['black', 'white', 'grey', 'gray', 'navy', 'beige', 'charcoal'];
    const neutralCount = colors.filter(color => neutrals.includes(color)).length;
    const totalColors = colors.length;
    
    if (neutralCount >= totalColors - 1) {
        return 0.9; // High score for neutral-dominant outfits
    }
    
    // Check for monochromatic outfit (all same color family)
    const uniqueColors = [...new Set(colors)];
    if (uniqueColors.length === 1) {
        return 0.8;
    }
    
    // Check for complementary color scheme (2-3 colors that work well together)
    const colorWheel: { [key: string]: string[] } = {
        red: ['orange', 'purple'],
        orange: ['red', 'yellow'],
        yellow: ['orange', 'green'],
        green: ['yellow', 'blue'],
        blue: ['green', 'purple'],
        purple: ['blue', 'red'],
    };
    
    const complementaryPairs: { [key: string]: string } = {
        red: 'green',
        orange: 'blue', 
        yellow: 'purple',
        green: 'red',
        blue: 'orange',
        purple: 'yellow'
    };
    
    // Check if outfit has complementary colors
    let hasComplementary = false;
    for (let i = 0; i < uniqueColors.length; i++) {
        for (let j = i + 1; j < uniqueColors.length; j++) {
            const color1 = uniqueColors[i];
            const color2 = uniqueColors[j];
            if ((complementaryPairs[color1] && complementaryPairs[color1] === color2) || 
                (complementaryPairs[color2] && complementaryPairs[color2] === color1)) {
                hasComplementary = true;
                break;
            }
        }
    }
    
    if (hasComplementary) {
        return 0.8;
    }
    
    // Check for analogous color scheme (adjacent colors)
    let hasAnalogous = false;
    for (let i = 0; i < uniqueColors.length; i++) {
        for (let j = i + 1; j < uniqueColors.length; j++) {
            const color1 = uniqueColors[i];
            const color2 = uniqueColors[j];
            if (colorWheel[color1]?.includes(color2) || colorWheel[color2]?.includes(color1)) {
                hasAnalogous = true;
                break;
            }
        }
    }
    
    if (hasAnalogous) {
        return 0.7;
    }
    
    // Check for too many different colors (clashing)
    if (uniqueColors.length > 3) {
        return 0.3;
    }
    
    // Default case - moderate coordination
    return 0.5;
};
  
// Helper to score style consistency
const getStyleConsistencyScore = (items: (WardrobeItem | any)[]): number => {
    if (items.length < 2) return 1.0;
    const allTags = items.flatMap(item => item.tags || []);
    if (allTags.length === 0) return 0.5;
    const tagCounts = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const counts = Array.from(Object.values(tagCounts) as number[]);
    if (counts.some(count => count === items.length)) {
        return 1.0;
    }
    if (counts.some(count => count >= items.length / 2)) {
        return 0.7;
    }
    return 0.4;
};

// Helper to get style preference score
const getStylePreferenceScore = (outfit: (WardrobeItem | any)[], stylePreference: string): number => {
    const styleKeywords = {
        casual: ['casual', 'comfortable', 'relaxed', 'streetwear', 'sporty', 't-shirt', 'sweat', 'jogger', 'sneaker'],
        smart: ['smart', 'business', 'casual', 'polo', 'chino', 'loafer', 'blazer'],
        formal: ['formal', 'business', 'suit', 'dress', 'blazer', 'tie', 'oxford', 'dress shoe']
    };
    
    const outfitText = outfit.map(item => `${item.name} ${item.tags?.join(' ') || ''}`).join(' ').toLowerCase();
    const targetKeywords = styleKeywords[stylePreference as keyof typeof styleKeywords] || styleKeywords.casual;
    
    // Count how many style-appropriate keywords are present
    const matchingKeywords = targetKeywords.filter(keyword => 
        outfitText.includes(keyword)
    ).length;
    
    // Check for style mismatches (e.g., casual items with formal items)
    const hasStyleMismatch = () => {
        const casualItems = outfit.some(item => 
            item.name?.toLowerCase().includes('t-shirt') || 
            item.name?.toLowerCase().includes('sweat') ||
            item.tags?.includes('casual')
        );
        const formalItems = outfit.some(item => 
            item.name?.toLowerCase().includes('blazer') || 
            item.name?.toLowerCase().includes('suit') ||
            item.tags?.includes('formal')
        );
        return casualItems && formalItems;
    };
    
    // Base score based on keyword matches
    let score = Math.min(1.0, matchingKeywords / targetKeywords.length * 0.8 + 0.2);
    
    // Penalize style mismatches
    if (hasStyleMismatch()) {
        score *= 0.3; // Heavy penalty for mixing casual and formal
    }
    
    // Bonus for style preference consistency
    if (stylePreference === 'casual' && matchingKeywords >= 2) {
        score = Math.min(1.0, score + 0.2);
    } else if (stylePreference === 'smart' && matchingKeywords >= 2) {
        score = Math.min(1.0, score + 0.15);
    } else if (stylePreference === 'formal' && matchingKeywords >= 2) {
        score = Math.min(1.0, score + 0.1);
    }
    
    return score;
};

// Reinforcement Learning System for User Preferences
interface UserPreference {
  userId: string;
  itemId: string;
  category: string;
  color: string;
  brand: string;
  tags: string[];
  preference: 'like' | 'dislike' | 'neutral';
  confidence: number;
  timestamp: Date;
}

interface PreferenceScore {
  itemId: string;
  category: string;
  color: string;
  brand: string;
  tags: string[];
  likeScore: number;
  dislikeScore: number;
  totalInteractions: number;
  lastUpdated: Date;
}

class PreferenceLearningSystem {
  private static userPreferences: Map<string, UserPreference[]> = new Map();
  private static preferenceScores: Map<string, PreferenceScore[]> = new Map();

  // Record user interaction with outfit
  static async recordUserInteraction(
    userId: string,
    outfit: (WardrobeItem | any)[],
    action: 'like' | 'dislike',
    stylePreference: string
  ): Promise<void> {
    try {
      const preferences: UserPreference[] = outfit.map(item => ({
        userId,
        itemId: item.id,
        category: item.category,
        color: item.color || 'unknown',
        brand: item.brand || 'unknown',
        tags: item.tags || [],
        preference: action,
        confidence: 1.0,
        timestamp: new Date()
      }));

      // Store user preferences
      const existingPreferences = this.userPreferences.get(userId) || [];
      this.userPreferences.set(userId, [...existingPreferences, ...preferences]);

      // Update preference scores
      await this.updatePreferenceScores(userId, preferences);

      // Save to Firestore for persistence
      await this.savePreferencesToFirestore(userId, preferences);

      // Detailed learning feedback
      console.log(`🧠 [AI Learning] ${action.toUpperCase()} recorded for ${outfit.length} items:`);
      outfit.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name} (${item.category}, ${item.color})`);
      });
      
      // Show current learning stats
      const totalPrefs = existingPreferences.length + preferences.length;
      console.log(`📊 [AI Stats] Total interactions: ${totalPrefs}`);
      
      // Show category preferences
      const categoryCounts = [...existingPreferences, ...preferences]
        .filter(p => p.preference === 'like')
        .reduce((acc, p) => {
          acc[p.category] = (acc[p.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      
      if (Object.keys(categoryCounts).length > 0) {
        console.log(`🎯 [AI Learning] Current category preferences:`, categoryCounts);
      }
      
    } catch (error) {
      console.error('Error recording user interaction:', error);
    }
  }

  // Calculate preference score for an item
  static getItemPreferenceScore(userId: string, item: any): number {
    const userPrefs = this.userPreferences.get(userId) || [];
    const itemPrefs = userPrefs.filter(p => p.itemId === item.id);
    
    if (itemPrefs.length === 0) return 0.5; // Neutral if no preferences

    const likes = itemPrefs.filter(p => p.preference === 'like').length;
    const dislikes = itemPrefs.filter(p => p.preference === 'dislike').length;
    const total = likes + dislikes;

    if (total === 0) return 0.5;

    // Calculate weighted score based on recency and frequency
    const recentWeight = 1.5;
    const now = new Date();
    const recentPrefs = itemPrefs.filter(p => 
      (now.getTime() - p.timestamp.getTime()) < 7 * 24 * 60 * 60 * 1000 // Last 7 days
    );

    const recentLikes = recentPrefs.filter(p => p.preference === 'like').length;
    const recentDislikes = recentPrefs.filter(p => p.preference === 'dislike').length;

    const baseScore = likes / total;
    const recentScore = recentLikes / (recentLikes + recentDislikes);
    
    // Weight recent preferences more heavily
    return (baseScore * 0.6) + (recentScore * 0.4);
  }

  // Get category preference score
  static getCategoryPreferenceScore(userId: string, category: string): number {
    const userPrefs = this.userPreferences.get(userId) || [];
    const categoryPrefs = userPrefs.filter(p => p.category === category);
    
    if (categoryPrefs.length === 0) return 0.5;

    const likes = categoryPrefs.filter(p => p.preference === 'like').length;
    const dislikes = categoryPrefs.filter(p => p.preference === 'dislike').length;
    const total = likes + dislikes;

    return total > 0 ? likes / total : 0.5;
  }

  // Get color preference score
  static getColorPreferenceScore(userId: string, color: string): number {
    const userPrefs = this.userPreferences.get(userId) || [];
    const colorPrefs = userPrefs.filter(p => p.color === color);
    
    if (colorPrefs.length === 0) return 0.5;

    const likes = colorPrefs.filter(p => p.preference === 'like').length;
    const dislikes = colorPrefs.filter(p => p.preference === 'dislike').length;
    const total = likes + dislikes;

    return total > 0 ? likes / total : 0.5;
  }

  // Get brand preference score
  static getBrandPreferenceScore(userId: string, brand: string): number {
    const userPrefs = this.userPreferences.get(userId) || [];
    const brandPrefs = userPrefs.filter(p => p.brand === brand);
    
    if (brandPrefs.length === 0) return 0.5;

    const likes = brandPrefs.filter(p => p.preference === 'like').length;
    const dislikes = brandPrefs.filter(p => p.preference === 'dislike').length;
    const total = likes + dislikes;

    return total > 0 ? likes / total : 0.5;
  }

  // Update preference scores based on new interactions
  private static async updatePreferenceScores(userId: string, newPreferences: UserPreference[]): Promise<void> {
    const existingScores = this.preferenceScores.get(userId) || [];
    const updatedScores = [...existingScores];

    for (const pref of newPreferences) {
      const existingScore = updatedScores.find(s => s.itemId === pref.itemId);
      
      if (existingScore) {
        // Update existing score
        if (pref.preference === 'like') {
          existingScore.likeScore += 1;
        } else {
          existingScore.dislikeScore += 1;
        }
        existingScore.totalInteractions += 1;
        existingScore.lastUpdated = new Date();
      } else {
        // Create new score
        updatedScores.push({
          itemId: pref.itemId,
          category: pref.category,
          color: pref.color,
          brand: pref.brand,
          tags: pref.tags,
          likeScore: pref.preference === 'like' ? 1 : 0,
          dislikeScore: pref.preference === 'dislike' ? 1 : 0,
          totalInteractions: 1,
          lastUpdated: new Date()
        });
      }
    }

    this.preferenceScores.set(userId, updatedScores);
  }

  // Save preferences to Firestore
  private static async savePreferencesToFirestore(userId: string, preferences: UserPreference[]): Promise<void> {
    try {
      await FirestoreService.saveUserPreferences(userId, preferences);
      console.log(`[Preference Learning] Saved ${preferences.length} preferences to Firestore for user ${userId}`);
    } catch (error) {
      console.error('Error saving preferences to Firestore:', error);
    }
  }

  // Load preferences from Firestore
  static async loadPreferencesFromFirestore(userId: string): Promise<void> {
    try {
      const preferences = await FirestoreService.loadUserPreferences(userId);
      const scores = await FirestoreService.loadPreferenceScores(userId);
      
      // Update in-memory storage
      this.userPreferences.set(userId, preferences);
      this.preferenceScores.set(userId, scores);
      
      console.log(`[Preference Learning] Loaded ${preferences.length} preferences and ${scores.length} scores from Firestore for user ${userId}`);
    } catch (error) {
      console.error('Error loading preferences from Firestore:', error);
    }
  }
}

// Enhanced scoring function that includes user preferences
const getPreferenceAdjustedScore = (outfit: (WardrobeItem | any)[], userId: string): number => {
  if (!userId) return 0.5;

  const itemScores = outfit.map(item => {
    const itemScore = PreferenceLearningSystem.getItemPreferenceScore(userId, item);
    const categoryScore = PreferenceLearningSystem.getCategoryPreferenceScore(userId, item.category);
    const colorScore = PreferenceLearningSystem.getColorPreferenceScore(userId, item.color);
    const brandScore = PreferenceLearningSystem.getBrandPreferenceScore(userId, item.brand);

    // Weight the different preference factors
    return (itemScore * 0.4) + (categoryScore * 0.3) + (colorScore * 0.2) + (brandScore * 0.1);
  });

  return itemScores.reduce((sum, score) => sum + score, 0) / itemScores.length;
};

export class StyleService {
    static scoreOutfit(
        outfit: (WardrobeItem | any)[],
        weather: WeatherData | null,
        stylePreference: string = 'casual',
        userId?: string
    ): number {
        // 1. Color Harmony Score (25% weight)
        const colorScore = getColorHarmonyScore(outfit);
        
        // 2. Style Preference Score (20% weight)
        const stylePreferenceScore = getStylePreferenceScore(outfit, stylePreference);
        
        // 3. Weather Appropriateness Score (25% weight)
        const weatherScore = weather ? scoreWeatherAppropriateness(outfit, weather) : 0.5;
        
        // 4. Style Consistency Score (15% weight)
        const styleScore = getStyleConsistencyScore(outfit);
        
        // 5. User Preference Score (15% weight) - NEW!
        const preferenceScore = userId ? getPreferenceAdjustedScore(outfit, userId) : 0.5;
        
        // Weighted average with adjusted weights
        const finalScore = (colorScore * 0.25) + (stylePreferenceScore * 0.20) + (weatherScore * 0.25) + (styleScore * 0.15) + (preferenceScore * 0.15);
        
        // Log detailed scoring for debugging (only for first few outfits)
        const shouldLogScoring = (globalThis as any)._scoringLogCount === undefined || (globalThis as any)._scoringLogCount < 3;
        if (shouldLogScoring) {
            console.log(`[Outfit Scoring] ${outfit.map(i => i.name).join(' + ')}`);
            console.log(`  Color Harmony: ${colorScore.toFixed(3)} (25%)`);
            console.log(`  Style Preference (${stylePreference}): ${stylePreferenceScore.toFixed(3)} (20%)`);
            console.log(`  Weather Appropriateness: ${weatherScore.toFixed(3)} (25%)`);
            console.log(`  Style Consistency: ${styleScore.toFixed(3)} (15%)`);
            console.log(`  User Preference: ${preferenceScore.toFixed(3)} (15%)`);
            console.log(`  Final Score: ${finalScore.toFixed(3)}`);
            (globalThis as any)._scoringLogCount = ((globalThis as any)._scoringLogCount || 0) + 1;
        }
        
        return finalScore;
    }

    // Record user interaction for learning
    static async recordUserInteraction(
        userId: string,
        outfit: (WardrobeItem | any)[],
        action: 'like' | 'dislike',
        stylePreference: string
    ): Promise<void> {
        await PreferenceLearningSystem.recordUserInteraction(userId, outfit, action, stylePreference);
    }

    static async getOutfitSuggestions(userId: string, stylePreference: string = 'casual'): Promise<OutfitSuggestion[]> {
        try {
            if (!userId) {
                console.warn('getOutfitSuggestions called with undefined userId');
                return [];
            }

            // Load user preferences
            await PreferenceLearningSystem.loadPreferencesFromFirestore(userId);

            // 1. Fetch all data concurrently with error handling
            const location = await WeatherService.getCurrentLocation();
            const [weather, wardrobe, swipeHistory, user, retailerProducts] = await Promise.allSettled([
                WeatherService.getCurrentWeather(location.coords.latitude, location.coords.longitude),
                FirestoreService.getWardrobeItems(userId),
                FirestoreService.getSwipeHistory(userId),
                FirestoreService.getUser(userId),
                FirestoreService.getRetailerProducts()
            ]);

            // Extract successful results
            const weatherData = weather.status === 'fulfilled' ? weather.value : null;
            const wardrobeItems = wardrobe.status === 'fulfilled' ? wardrobe.value : [];
            const swipeHistoryData = swipeHistory.status === 'fulfilled' ? swipeHistory.value : [];
            const retailerItems = retailerProducts.status === 'fulfilled' ? retailerProducts.value : [];

            // If no user data, return empty array
            const userData = user.status === 'fulfilled' ? user.value : null;
            if (!userData) {
                console.warn('User not found for outfit suggestions');
                return [];
            }

            // If no weather data, create a default weather object
            const defaultWeather: WeatherData = {
                temperature: 20,
                condition: 'Clear',
                humidity: 60,
                windSpeed: 5,
                description: 'partly cloudy',
                icon: '02d',
                feelsLike: 20,
                precipitation: 0,
                uv: 5,
                forecast: []
            };
            const weatherToUse = weatherData || defaultWeather;

            // Combine wardrobe and retailer items for outfit generation
            const allItems: (WardrobeItem | any)[] = [...wardrobeItems, ...retailerItems];

            // Build allTops after allBottoms
            const allTops = allItems.filter((i: any) => i.category === 'tops');

            // Utility: Assign fallback color if missing
            function withFallbackColor(item: any): any {
                if (!item.color || item.color.trim() === '') {
                    return { ...item, color: 'unknown' };
                }
                return item;
            }

            // Utility: Check weather compatibility
            function isWeatherCompatible(item: any, weather: any): boolean {
                if (!item.weatherCompatibility) return true; // If no info, allow
                const { seasonality, temperatureRange, weatherConditions } = item.weatherCompatibility;
                let compatible = true;
                if (seasonality && Array.isArray(seasonality) && weather && weather.season) {
                    compatible = compatible && seasonality.includes(weather.season);
                }
                if (temperatureRange && weather && typeof weather.temperature === 'number') {
                    compatible = compatible && weather.temperature >= (temperatureRange.min ?? -100) && weather.temperature <= (temperatureRange.max ?? 100);
                }
                if (weatherConditions && Array.isArray(weatherConditions) && weather && weather.condition) {
                    compatible = compatible && weatherConditions.some(cond => weather.condition.toLowerCase().includes(cond.toLowerCase()));
                }
                return compatible;
            }

            // Build retailer bottoms: allow missing color, assign fallback, require id, name, category, brand, imageUrl
            let retailerBottoms = retailerItems
                .filter(i => i.category === 'bottoms' && i.id && i.name && i.category && i.brand && i.imageUrl)
                .map(withFallbackColor)
                .filter(i => isWeatherCompatible(i, weatherToUse));
            // Build wardrobe bottoms: assign fallback color, require id, name, category, brand, imageUrl, userId
            let wardrobeBottoms = wardrobeItems
                .filter(i => i.category === 'bottoms' && i.id && i.name && i.category && i.brand && i.imageUrl && i.userId)
                .map(withFallbackColor)
                .filter(i => isWeatherCompatible(i, weatherToUse));
            // Prioritize retailer bottoms
            let allBottoms = [...retailerBottoms, ...wardrobeBottoms];
            // Shuffle for variety
            allBottoms = allBottoms.slice().sort(() => Math.random() - 0.5);
            const allOuterwear = allItems.filter(i => i.category === 'outerwear');
            const allShoes = allItems.filter(i => i.category === 'shoes');

            let potentialOutfits: (WardrobeItem | any)[][] = [];
            const usedSignatures: Set<string> = (globalThis as any)._usedOutfitSignatures || new Set();
            const usedCorePairs: Set<string> = (globalThis as any)._usedCorePairs || new Set();

            const isCold = weatherToUse.temperature < 20;
            
            const corePairs = [];
            
            for (const top of allTops) {
                for (const bottom of allBottoms) {
                    const coreSignature = [top.id, bottom.id].sort().join('-');
                    if (usedCorePairs.has(coreSignature)) continue;
                    const pair = [top, bottom];
                    const signature = pair.map(i => i.id).sort().join('-');
                    if (usedSignatures.has(signature)) continue;
                    const score = StyleService.scoreOutfit(pair, weatherToUse, stylePreference, userId);
                    
                    if (score > 0.5) {
                        corePairs.push({ outfit: pair, score, signature, coreSignature });
                        usedCorePairs.add(coreSignature);
                        usedSignatures.add(signature);
                    }
                }
            }

            // 2. For each pair, generate core and up to N layered versions if cold
            const OUTERWEAR_VARIETY = 5; // Try up to 5 different outerwears for more variety
            const layeredOrCoreOutfits = [];
            
            for (const pair of corePairs) {
                let addedLayered = 0;
                let lastWasLayered = false;
                if (isCold && allOuterwear.length > 0) {
                    // Shuffle outerwears for more randomness
                    const shuffledOuterwear = allOuterwear.slice().sort(() => Math.random() - 0.5);
                    // Try up to OUTERWEAR_VARIETY best-matching outerwears
                    const scoredOuterwear = shuffledOuterwear.map(outerwear => {
                        const layeredOutfit = [...pair.outfit, outerwear];
                        const score = StyleService.scoreOutfit(layeredOutfit, weatherToUse, stylePreference, userId);
                        return { outerwear, score, layeredOutfit };
                    }).sort((a, b) => b.score - a.score);
                    
                    for (const { layeredOutfit, score } of scoredOuterwear.slice(0, OUTERWEAR_VARIETY)) {
                        const signature = layeredOutfit.map(i => i.id).sort().join('-');
                        if (!usedSignatures.has(signature) && score > 0.5) {
                            layeredOrCoreOutfits.push(layeredOutfit);
                            usedSignatures.add(signature);
                            addedLayered++;
                            lastWasLayered = true;
                        }
                    }
                }
                // Always add the core version if not just added as layered
                if (!lastWasLayered) {
                    const signature = pair.outfit.map(i => i.id).sort().join('-');
                    if (!usedSignatures.has(signature)) {
                        layeredOrCoreOutfits.push(pair.outfit);
                        usedSignatures.add(signature);
                    }
                }
            }
            
            // 3. Shuffle and filter so the same core pair doesn't appear twice in a row
            const shuffled = layeredOrCoreOutfits.sort(() => Math.random() - 0.5);
            const finalOutfits: (WardrobeItem | any)[][] = [];
            let lastBottomId: string | null = null;
            let lastTopId: string | null = null;
            let lastOuterwearId: string | null = null;
            
            for (const outfit of shuffled) {
                const top = outfit.find(i => i.category === 'tops');
                const bottom = outfit.find(i => i.category === 'bottoms');
                const outerwear = outfit.find(i => i.category === 'outerwear');
                // Only skip if the immediately previous outfit used the same item
                if ((bottom && bottom.id === lastBottomId) || (top && top.id === lastTopId) || (outerwear && outerwear.id === lastOuterwearId)) {
                    continue;
                }
                finalOutfits.push(outfit);
                lastTopId = top ? top.id : null;
                lastBottomId = bottom ? bottom.id : null;
                lastOuterwearId = outerwear ? outerwear.id : null;
            }
            // If after filtering, too few outfits remain, fill up with next best available (even if they repeat)
            if (finalOutfits.length < 20) {
                const extraRetailPairs = [];
                for (const top of allTops) {
                    for (const bottom of allBottoms) {
                        if (top.userId && bottom.userId) continue; // skip if both are wardrobe (already included)
                        const coreSignature = [top.id, bottom.id].sort().join('-');
                        if (usedSignatures.has(coreSignature)) continue;
                        const pair = [top, bottom];
                        const signature = pair.map(i => i.id).sort().join('-');
                        if (usedSignatures.has(signature)) continue;
                        const score = StyleService.scoreOutfit(pair, weatherToUse, stylePreference, userId);
                        if (score > 0.5) {
                            extraRetailPairs.push(pair);
                            usedSignatures.add(signature);
                        }
                    }
                }
                finalOutfits.push(...extraRetailPairs);
            }

            potentialOutfits = finalOutfits;

            // 5. Final Filtering, Scoring, and Ranking
            // Remove duplicate outfits that may have been generated
            const previouslyShownOutfits = getPreviouslyShownOutfits(swipeHistoryData);
            const uniqueOutfits = filterDuplicateOutfits(potentialOutfits, previouslyShownOutfits);
            
            // If no unique outfits remain, return mock suggestions
            if (uniqueOutfits.length === 0) {
                console.log('No unique outfits remaining, creating mock suggestions');
                return this.createMockSuggestions(weatherToUse);
            }

            // Final scoring and sorting
            const scoredOutfits = uniqueOutfits.map(outfit => ({
                outfit,
                score: StyleService.scoreOutfit(outfit, weatherToUse, stylePreference, userId),
            })).sort((a, b) => b.score - a.score);

            // Create OutfitSuggestion objects
            const finalSuggestions = scoredOutfits.slice(0, 50).map(({ outfit, score }) => {
                const reasoning = StyleService.generateOutfitReasoning(outfit, score, weatherToUse);
                return {
                    id: outfit.map(i => i.id).join('-'),
                    items: outfit,
                    reasoning,
                    confidence: score,
                    occasion: stylePreference,
                    weather: weatherToUse ? [weatherToUse.condition] : [],
                };
            });

            // After generating finalOutfits, log the bottoms used
            const bottomsUsed = finalOutfits.map(outfit => {
                const bottom = outfit.find(i => i.category === 'bottoms');
                return bottom ? {id: bottom.id, name: bottom.name, source: bottom.retailer ? 'retailer' : 'wardrobe'} : null;
            }).filter(Boolean);
            console.log('Bottoms used in final outfits:', bottomsUsed);

            // Fallback: If no retailer bottoms are used, forcibly inject at least one retailer bottom into the first few outfits
            const retailerBottomsUsed = bottomsUsed.filter(b => b && b.source === 'retailer');
            if (retailerBottoms.length > 0 && retailerBottomsUsed.length === 0 && finalOutfits.length > 0) {
                // Replace the bottom in the first few outfits with retailer bottoms
                for (let i = 0; i < Math.min(retailerBottoms.length, finalOutfits.length, 3); i++) {
                    const outfit = finalOutfits[i];
                    const top = outfit.find(i => i.category === 'tops');
                    const outerwear = outfit.find(i => i.category === 'outerwear');
                    const newBottom = retailerBottoms[i % retailerBottoms.length];
                    // Rebuild the outfit with the retailer bottom
                    const rebuilt = [top, newBottom].filter(Boolean);
                    if (outerwear) rebuilt.push(outerwear);
                    finalOutfits[i] = rebuilt;
                }
                // Recompute bottomsUsed for logging
                const bottomsUsedAfter = finalOutfits.map(outfit => {
                    const bottom = outfit.find(i => i.category === 'bottoms');
                    return bottom ? {id: bottom.id, name: bottom.name, source: bottom.retailer ? 'retailer' : 'wardrobe'} : null;
                }).filter(Boolean);
                console.log('Bottoms used in final outfits after fallback:', bottomsUsedAfter);
            }

            // Only log details for the top 5 outfit cards to avoid spam
            scoredOutfits.slice(0, 5).forEach(({ outfit, score }, idx) => {
                const colorArr = outfit.map(i => i.color);
                const itemDetails = outfit.map(i => `${i.name} (${i.color})`).join(' | ');
                const colorScore = getColorHarmonyScore(outfit);
                const reasoning = StyleService.generateOutfitReasoning(outfit, score, weatherToUse);
                console.log(`[Outfit Card #${idx + 1}]`);
                console.log(`  Items: ${itemDetails}`);
                console.log(`  Colors: [${colorArr.join(', ')}]`);
                console.log(`  Color Harmony Score: ${colorScore}`);
                console.log(`  Full Outfit Score: ${score}`);
                console.log(`  Style Preference: ${stylePreference}`);
                console.log(`  Reasoning: ${reasoning}`);
            });

            return finalSuggestions;
        } catch (error) {
            console.error('Error generating outfit suggestions:', error);
            return [];
        }
    }

    // Development helper: Reset swipe history for testing
    static async resetSwipeHistory(userId: string): Promise<void> {
        try {
            console.log('Resetting swipe history for user:', userId);
            // This would typically delete swipe history records
            // For now, we'll just log it
            console.log('Swipe history reset completed');
        } catch (error) {
            console.error('Error resetting swipe history:', error);
        }
    }

    // Helper method to reconstruct outfit items from signature
    static async reconstructOutfitFromSignature(
        outfitSignature: string, 
        userId: string
    ): Promise<WardrobeItem[]> {
        try {
            if (!outfitSignature) return [];

            const itemIds = outfitSignature.split('-');
            
            // Fetch wardrobe items
            const wardrobeItems = await FirestoreService.getWardrobeItems(userId);
            
            const reconstructedItems: WardrobeItem[] = [];
            
            for (const itemId of itemIds) {
                // Try to find in wardrobe first
                const wardrobeItem = wardrobeItems.find(item => item.id === itemId);
                if (wardrobeItem) {
                    reconstructedItems.push(wardrobeItem);
                    continue;
                }
            }
            
            return reconstructedItems;
        } catch (error) {
            console.error('Error reconstructing outfit from signature:', error);
            return [];
        }
    }

    private static createMockSuggestions(weather: WeatherData): OutfitSuggestion[] {
        const mockItems: WardrobeItem[] = [
            {
                id: 'mock-1',
                name: 'Classic White T-Shirt',
                brand: 'Basic Brand',
                imageUrl: 'https://via.placeholder.com/300x400/FFFFFF/000000?text=White+T-Shirt',
                category: 'tops',
                color: 'white',
                size: 'M',
                tags: ['casual'],
                isFavorite: true,
                wearCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                weatherCompatibility: { temperatureRange: { min: 0, max: 40 }, weatherConditions: ['Clear'], seasonality: ['all'] },
                userId: 'mock-user'
            },
            {
                id: 'mock-2',
                name: 'Blue Denim Jeans',
                brand: 'Denim Co',
                imageUrl: 'https://via.placeholder.com/300x400/0000FF/FFFFFF?text=Blue+Jeans',
                category: 'bottoms',
                color: 'blue',
                size: '32',
                tags: ['casual'],
                isFavorite: true,
                wearCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                weatherCompatibility: { temperatureRange: { min: 0, max: 40 }, weatherConditions: ['Clear'], seasonality: ['all'] },
                userId: 'mock-user'
            },
            {
                id: 'mock-3',
                name: 'Black Sneakers',
                brand: 'Shoe Brand',
                imageUrl: 'https://via.placeholder.com/300x400/000000/FFFFFF?text=Black+Sneakers',
                category: 'shoes',
                color: 'black',
                size: '42',
                tags: ['casual'],
                isFavorite: true,
                wearCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                weatherCompatibility: { temperatureRange: { min: 0, max: 40 }, weatherConditions: ['Clear'], seasonality: ['all'] },
                userId: 'mock-user'
            }
        ];

        return [
            {
                id: 'mock-suggestion-1',
                items: [mockItems[0], mockItems[1]],
                reasoning: 'A classic combination that never goes out of style. The white t-shirt and blue jeans create a timeless look.',
                occasion: 'casual',
                weather: [weather.condition],
                confidence: 0.8
            },
            {
                id: 'mock-suggestion-2',
                items: [mockItems[0], mockItems[1], mockItems[2]],
                reasoning: 'Complete your look with these comfortable black sneakers. Perfect for a casual day out.',
                occasion: 'casual',
                weather: [weather.condition],
                confidence: 0.8
            }
        ];
    }

    private static generateOutfitReasoning(outfit: (WardrobeItem | any)[], score: number, weather: WeatherData | null): string {
        const [item1, item2, item3] = outfit;
        let reasoning = `This is a great look. The ${item1.name} and ${item2.name}`;
        
        // Add weather reasoning
        if (weather) {
            const temp = weather.temperature;
            if (temp < 15) {
                if (outfit.some(item => item.category === 'outerwear')) {
                    reasoning += ` work perfectly for the cold weather (${temp}°C). The layering keeps you warm and stylish.`;
                } else if (outfit.some(item => item.name?.toLowerCase().includes('short'))) {
                    reasoning += ` might be a bit chilly for ${temp}°C weather, but the style is on point.`;
                } else {
                    reasoning += ` are perfect for the cool ${temp}°C weather.`;
                }
            } else if (temp > 25) {
                if (outfit.some(item => item.name?.toLowerCase().includes('short'))) {
                    reasoning += ` are ideal for the warm ${temp}°C weather.`;
                } else {
                    reasoning += ` work well for the warm weather, though you might want something lighter.`;
                }
            } else {
                reasoning += ` are perfect for the moderate ${temp}°C weather.`;
            }
        }
        
        // Add color harmony reasoning
        const colors = outfit.map(item => item.color).filter(Boolean);
        const uniqueColors = [...new Set(colors)];
        if (uniqueColors.length === 1) {
            reasoning += ` The monochromatic ${uniqueColors[0]} color scheme creates a sophisticated, cohesive look.`;
        } else if (uniqueColors.length === 2) {
            const neutrals = ['black', 'white', 'grey', 'gray', 'navy', 'beige', 'charcoal'];
            if (neutrals.includes(uniqueColors[0]) || neutrals.includes(uniqueColors[1])) {
                reasoning += ` The neutral tones create a timeless, versatile combination.`;
            } else {
                reasoning += ` The color combination creates a balanced, harmonious look.`;
            }
        } else {
            reasoning += ` The color palette works well together for a polished appearance.`;
        }
        
        // Add style reasoning
        const hasOuterwear = outfit.some(item => item.category === 'outerwear');
        const hasShorts = outfit.some(item => item.name?.toLowerCase().includes('short'));
        const hasBlazer = outfit.some(item => item.name?.toLowerCase().includes('blazer'));
        
        if (hasOuterwear) {
            reasoning += ` The layering adds depth and sophistication to the outfit.`;
        }
        
        if (hasBlazer) {
            reasoning += ` The blazer elevates the look for a more polished appearance.`;
        }
        
        if (hasShorts && weather && weather.temperature < 15) {
            reasoning += ` While the shorts might be chilly, they add a casual, relaxed vibe.`;
        }
        
        // Add confidence level reasoning
        if (score > 0.8) {
            reasoning += ` This is an excellent combination with high confidence.`;
        } else if (score > 0.6) {
            reasoning += ` This is a solid, well-coordinated outfit.`;
        } else {
            reasoning += ` This combination works well together.`;
        }
        
        return reasoning;
    }

    // Helper to get best-matching outerwear for a given top+bottom
    static getBestMatchingOuterwear(top: WardrobeItem | any, bottom: WardrobeItem | any, outerwearList: (WardrobeItem | any)[], weather: WeatherData | null) {
        let bestScore = 0;
        let bestOuterwear = null;
        for (const outerwear of outerwearList) {
            const score = StyleService.scoreOutfit([top, bottom, outerwear], weather);
            if (score > bestScore) {
                bestScore = score;
                bestOuterwear = outerwear;
            }
        }
        return bestOuterwear;
    }
} 