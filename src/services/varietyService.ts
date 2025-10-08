// Variety and Freshness Service - Ensures outfit diversity and freshness
import { OutfitItem, OutfitCombination } from './oracleService';

export interface VarietyConfig {
  maxRecentOutfits: number;
  seasonalWeight: number;
  newItemBoost: number;
  rotationThreshold: number;
}

export class VarietyService {
  private static recentOutfits: string[] = [];
  private static outfitFrequency: Map<string, number> = new Map();
  private static lastGenerated: Date = new Date();

  // Configuration for variety algorithms
  private static config: VarietyConfig = {
    maxRecentOutfits: 10,
    seasonalWeight: 1.5,
    newItemBoost: 2.0,
    rotationThreshold: 0.3,
  };

  // Apply variety and freshness to outfit generation
  static applyVarietyAndFreshness(
    items: OutfitItem[],
    baseOutfits: OutfitCombination[]
  ): OutfitCombination[] {
    // Safety checks
    if (!items || !Array.isArray(items)) {
      console.error('Invalid items array in VarietyService');
      return baseOutfits || [];
    }
    
    if (!baseOutfits || !Array.isArray(baseOutfits)) {
      console.error('Invalid baseOutfits array in VarietyService');
      return [];
    }

    // 1. Seasonal Rotation
    const seasonalItems = this.getSeasonalItems(items);
    
    // 2. New Item Integration
    const newItems = this.getNewItems(items);
    
    // 3. Rotation Algorithm
    const variedOutfits = this.applyRotationAlgorithm(baseOutfits);
    
    // 4. Boost seasonal and new items
    const enhancedOutfits = this.boostSpecialItems(variedOutfits, seasonalItems, newItems);
    
    return enhancedOutfits;
  }

  // Get seasonal items (bring to front)
  private static getSeasonalItems(items: OutfitItem[]): OutfitItem[] {
    if (!items || !Array.isArray(items)) {
      return [];
    }
    
    const currentMonth = new Date().getMonth();
    const season = this.getCurrentSeason(currentMonth);
    
    return items.filter(item => {
      if (!item || !item.tags) return false;
      const tags = Array.isArray(item.tags) ? item.tags : [];
      return tags.some(tag => 
        tag && typeof tag === 'string' && (
          tag.toLowerCase().includes(season) ||
          tag.toLowerCase().includes('seasonal') ||
          tag.toLowerCase().includes('trendy')
        )
      );
    });
  }

  // Get recently added items
  private static getNewItems(items: OutfitItem[]): OutfitItem[] {
    if (!items || !Array.isArray(items)) {
      return [];
    }
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return items.filter(item => {
      if (!item) return false;
      // Check if item was added recently (this would need to be tracked in your data)
      // For now, we'll use a simple heuristic based on item ID or tags
      const tags = item.tags || [];
      return Array.isArray(tags) && tags.some(tag => 
        tag && typeof tag === 'string' && (
          tag.toLowerCase().includes('new') ||
          tag.toLowerCase().includes('recent') ||
          tag.toLowerCase().includes('latest')
        )
      );
    });
  }

  // Apply rotation algorithm to avoid repetitive combinations
  private static applyRotationAlgorithm(outfits: OutfitCombination[]): OutfitCombination[] {
    if (!outfits || !Array.isArray(outfits)) {
      console.error('Invalid outfits array in applyRotationAlgorithm');
      return [];
    }
    
    const variedOutfits: OutfitCombination[] = [];
    
    for (const outfit of outfits) {
      if (!outfit) {
        console.warn('Skipping invalid outfit in rotation algorithm');
        continue;
      }
      
      const outfitKey = this.getOutfitKey(outfit);
      const frequency = this.outfitFrequency.get(outfitKey) || 0;
      
      // If outfit hasn't been shown recently or frequency is low, include it
      if (frequency < this.config.rotationThreshold || !this.recentOutfits.includes(outfitKey)) {
        variedOutfits.push(outfit);
        this.outfitFrequency.set(outfitKey, frequency + 1);
        this.recentOutfits.push(outfitKey);
        
        // Keep recent outfits list manageable
        if (this.recentOutfits.length > this.config.maxRecentOutfits) {
          this.recentOutfits.shift();
        }
      }
    }
    
    return variedOutfits;
  }

  // Boost seasonal and new items in outfit generation
  private static boostSpecialItems(
    outfits: OutfitCombination[],
    seasonalItems: OutfitItem[],
    newItems: OutfitItem[]
  ): OutfitCombination[] {
    return outfits.map(outfit => {
      let boostedConfidence = outfit.confidence;
      
      // Boost confidence for outfits with seasonal items
      const hasSeasonalItem = outfit.items.some(item => 
        seasonalItems.some(seasonal => seasonal.id === item.id)
      );
      if (hasSeasonalItem) {
        boostedConfidence = Math.min(100, boostedConfidence * this.config.seasonalWeight);
      }
      
      // Boost confidence for outfits with new items
      const hasNewItem = outfit.items.some(item => 
        newItems.some(newItem => newItem.id === item.id)
      );
      if (hasNewItem) {
        boostedConfidence = Math.min(100, boostedConfidence * this.config.newItemBoost);
      }
      
      return {
        ...outfit,
        confidence: Math.round(boostedConfidence),
      };
    });
  }

  // Get current season based on month
  private static getCurrentSeason(month: number): string {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  // Generate unique key for outfit combination
  private static getOutfitKey(outfit: OutfitCombination): string {
    if (!outfit || !outfit.items || !Array.isArray(outfit.items)) {
      return `invalid-outfit-${Date.now()}`;
    }
    
    return outfit.items
      .filter(item => item && item.id)
      .map(item => item.id)
      .sort()
      .join('-');
  }

  // Reset variety tracking (useful for testing or periodic resets)
  static resetVarietyTracking(): void {
    this.recentOutfits = [];
    this.outfitFrequency.clear();
    this.lastGenerated = new Date();
  }

  // Get variety statistics
  static getVarietyStats(): {
    recentOutfitsCount: number;
    uniqueOutfitsGenerated: number;
    lastGenerated: Date;
  } {
    return {
      recentOutfitsCount: this.recentOutfits.length,
      uniqueOutfitsGenerated: this.outfitFrequency.size,
      lastGenerated: this.lastGenerated,
    };
  }
}
