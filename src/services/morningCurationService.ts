// Morning Curation Service
// Provides quick, professional outfit recommendations for busy professionals

import { OutfitCombination } from './oracleService';
import CountryRoadService from './countryRoadService';

export interface MorningOutfit {
  id: string;
  outfit: OutfitCombination;
  confidence: number;
  timeToGetReady: number; // in minutes
  weatherAppropriate: boolean;
  occasionAppropriate: boolean;
  quickTips: string[];
  whyItWorks: string[];
  alternativeItems: string[];
}

export interface MorningPreferences {
  maxPrepTime: number; // in minutes
  preferredFormality: 'casual' | 'smart-casual' | 'business' | 'formal';
  weather: {
    temperature: number;
    condition: string;
    humidity: number;
  };
  occasion: string;
  mustIncludeItems?: string[]; // specific items user wants to wear
  avoidItems?: string[]; // items user doesn't want to wear
  colorPreferences?: string[];
  stylePreferences?: string[];
}

export class MorningCurationService {
  // Get curated morning outfits for busy professionals
  static async getMorningOutfits(
    preferences: MorningPreferences,
    wardrobeItems: any[],
    count: number = 3
  ): Promise<MorningOutfit[]> {
    console.log('🌅 Generating morning outfit curation...');

    try {
      // Get suitable Country Road items
      const countryRoadItems = await CountryRoadService.getItemsForOccasion(preferences.occasion);
      const weatherSuitableItems = await CountryRoadService.getItemsForWeather(
        preferences.weather.temperature,
        preferences.weather.condition
      );

      // Filter by formality
      const formalityItems = countryRoadItems.filter(item => 
        this.matchesFormality(item.formality, preferences.preferredFormality)
      );

      // Combine wardrobe and Country Road items
      const allItems = [
        ...wardrobeItems.map(item => ({ ...item, isFromWardrobe: true })),
        ...formalityItems.map(item => CountryRoadService.convertToOutfitItem(item))
      ];

      // Generate outfit combinations
      const outfits = await this.generateQuickOutfits(allItems, preferences, count);

      // Convert to morning outfits with additional context
      return outfits.map(outfit => this.enhanceForMorning(outfit, preferences));

    } catch (error) {
      console.error('Error generating morning outfits:', error);
      return [];
    }
  }

  // Generate quick, professional outfits
  private static async generateQuickOutfits(
    items: any[],
    preferences: MorningPreferences,
    count: number
  ): Promise<OutfitCombination[]> {
    const outfits: OutfitCombination[] = [];
    const usedCombinations = new Set<string>();

    // Prioritize items based on morning efficiency
    const prioritizedItems = this.prioritizeForMorning(items, preferences);

    for (let i = 0; i < count; i++) {
      const outfit = this.createQuickOutfit(prioritizedItems, preferences, usedCombinations);
      if (outfit) {
        outfits.push(outfit);
        usedCombinations.add(outfit.id);
      }
    }

    return outfits;
  }

  // Create a quick, professional outfit
  private static createQuickOutfit(
    items: any[],
    preferences: MorningPreferences,
    usedCombinations: Set<string>
  ): OutfitCombination | null {
    // Essential categories for professional look
    const categories = ['Tops', 'Bottoms', 'Shoes', 'Outerwear'];
    const selectedItems: any[] = [];

    // Select one item from each essential category
    for (const category of categories) {
      const categoryItems = items.filter(item => 
        item.category === category && 
        this.isWeatherAppropriate(item, preferences.weather) &&
        this.isOccasionAppropriate(item, preferences.occasion)
      );

      if (categoryItems.length === 0) continue;

      // Prioritize items that are easy to wear and versatile
      const prioritized = categoryItems.sort((a, b) => {
        const aScore = this.getMorningEfficiencyScore(a, preferences);
        const bScore = this.getMorningEfficiencyScore(b, preferences);
        return bScore - aScore;
      });

      selectedItems.push(prioritized[0]);
    }

    if (selectedItems.length < 2) return null; // Need at least top and bottom

    // Create outfit combination
    const outfitId = `morning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: outfitId,
      items: selectedItems,
      occasion: preferences.occasion,
      weather: `${preferences.weather.temperature}°`,
      confidence: this.calculateConfidence(selectedItems, preferences),
      colorHarmony: this.analyzeColorHarmony(selectedItems),
      styleNotes: this.generateStyleNotes(selectedItems, preferences),
      fitAdvice: this.generateFitAdvice(selectedItems),
      whyItWorks: this.explainWhyItWorks(selectedItems, preferences),
      summary: this.generateSummary(selectedItems, preferences)
    };
  }

  // Enhance outfit with morning-specific context
  private static enhanceForMorning(
    outfit: OutfitCombination,
    preferences: MorningPreferences
  ): MorningOutfit {
    return {
      id: outfit.id,
      outfit,
      confidence: outfit.confidence,
      timeToGetReady: this.calculatePrepTime(outfit.items, preferences),
      weatherAppropriate: this.isWeatherAppropriate(outfit.items, preferences.weather),
      occasionAppropriate: this.isOccasionAppropriate(outfit.items, preferences.occasion),
      quickTips: this.generateQuickTips(outfit.items, preferences),
      whyItWorks: outfit.whyItWorks,
      alternativeItems: this.suggestAlternatives(outfit.items, preferences)
    };
  }

  // Prioritize items for morning efficiency
  private static prioritizeForMorning(items: any[], preferences: MorningPreferences): any[] {
    return items.sort((a, b) => {
      const aScore = this.getMorningEfficiencyScore(a, preferences);
      const bScore = this.getMorningEfficiencyScore(b, preferences);
      return bScore - aScore;
    });
  }

  // Calculate morning efficiency score
  private static getMorningEfficiencyScore(item: any, preferences: MorningPreferences): number {
    let score = 0;

    // Base score
    score += 10;

    // Versatility bonus
    if (item.tags?.includes('versatile')) score += 5;
    if (item.tags?.includes('classic')) score += 5;
    if (item.tags?.includes('timeless')) score += 5;

    // Easy care bonus
    if (item.material === 'cotton' || item.material === 'cotton blend') score += 3;
    if (item.tags?.includes('wrinkle-resistant')) score += 3;

    // Color versatility
    if (['white', 'black', 'navy', 'grey'].includes(item.color?.toLowerCase())) score += 4;

    // Formality match
    if (this.matchesFormality(item.formality, preferences.preferredFormality)) score += 5;

    // Weather appropriateness
    if (this.isWeatherAppropriate(item, preferences.weather)) score += 3;

    // Occasion appropriateness
    if (this.isOccasionAppropriate(item, preferences.occasion)) score += 3;

    // Must include items
    if (preferences.mustIncludeItems?.includes(item.id)) score += 10;

    // Avoid items penalty
    if (preferences.avoidItems?.includes(item.id)) score -= 20;

    return score;
  }

  // Check if item matches formality level
  private static matchesFormality(itemFormality: string, preferredFormality: string): boolean {
    const formalityLevels = {
      'casual': 1,
      'smart-casual': 2,
      'business': 3,
      'formal': 4
    };

    const itemLevel = formalityLevels[itemFormality] || 1;
    const preferredLevel = formalityLevels[preferredFormality] || 2;

    // Allow same level or one level up
    return itemLevel >= preferredLevel && itemLevel <= preferredLevel + 1;
  }

  // Check weather appropriateness
  private static isWeatherAppropriate(item: any, weather: any): boolean {
    if (!item.weatherSuitability) return true;

    const { temperature, condition } = weather;
    const { minTemp, maxTemp, conditions } = item.weatherSuitability;

    return temperature >= minTemp && 
           temperature <= maxTemp && 
           conditions.includes(condition);
  }

  // Check occasion appropriateness
  private static isOccasionAppropriate(item: any, occasion: string): boolean {
    if (!item.occasionSuitability) return true;

    return item.occasionSuitability.includes(occasion.toLowerCase());
  }

  // Calculate preparation time
  private static calculatePrepTime(items: any[], preferences: MorningPreferences): number {
    let baseTime = 5; // Base getting ready time

    // Add time for complex items
    items.forEach(item => {
      if (item.category === 'Outerwear' && item.subcategory === 'Blazer') baseTime += 2;
      if (item.category === 'Shoes' && item.subcategory === 'Boots') baseTime += 1;
      if (item.tags?.includes('delicate')) baseTime += 1;
    });

    // Add time for accessories
    if (items.some(item => item.category === 'Accessories')) baseTime += 2;

    return Math.min(baseTime, preferences.maxPrepTime);
  }

  // Generate quick tips for the outfit
  private static generateQuickTips(items: any[], preferences: MorningPreferences): string[] {
    const tips: string[] = [];

    // Weather tips
    if (preferences.weather.temperature < 15) {
      tips.push("Layer with a blazer or cardigan for warmth");
    }
    if (preferences.weather.condition === 'rainy') {
      tips.push("Consider a waterproof outer layer");
    }

    // Color tips
    const colors = items.map(item => item.color).filter(Boolean);
    if (colors.length > 0) {
      tips.push(`This ${colors[0].toLowerCase()} base works with any accent color`);
    }

    // Occasion tips
    if (preferences.occasion === 'work') {
      tips.push("Add a statement accessory to elevate the look");
    }

    // Time-saving tips
    if (items.some(item => item.tags?.includes('wrinkle-resistant'))) {
      tips.push("No ironing needed - perfect for busy mornings!");
    }

    return tips.slice(0, 3); // Limit to 3 tips
  }

  // Suggest alternative items
  private static suggestAlternatives(items: any[], preferences: MorningPreferences): string[] {
    const alternatives: string[] = [];

    items.forEach(item => {
      if (item.category === 'Tops') {
        alternatives.push("Try a different colored shirt or blouse");
      }
      if (item.category === 'Bottoms') {
        alternatives.push("Swap for different colored trousers or skirt");
      }
      if (item.category === 'Shoes') {
        alternatives.push("Consider different shoe style for variety");
      }
    });

    return alternatives.slice(0, 2);
  }

  // Calculate confidence score
  private static calculateConfidence(items: any[], preferences: MorningPreferences): number {
    let confidence = 50; // Base confidence

    // Weather appropriateness
    if (this.isWeatherAppropriate(items, preferences.weather)) confidence += 15;

    // Occasion appropriateness
    if (this.isOccasionAppropriate(items, preferences.occasion)) confidence += 15;

    // Color harmony
    const colorHarmony = this.analyzeColorHarmony(items);
    confidence += colorHarmony * 0.2;

    // Completeness
    if (items.length >= 3) confidence += 10;

    return Math.min(confidence, 100);
  }

  // Analyze color harmony
  private static analyzeColorHarmony(items: any[]): number {
    const colors = items.map(item => item.color?.toLowerCase()).filter(Boolean);
    if (colors.length < 2) return 50;

    // Simple color harmony analysis
    const colorGroups = {
      'neutral': ['white', 'black', 'grey', 'navy', 'beige', 'camel'],
      'warm': ['red', 'orange', 'yellow', 'pink', 'brown'],
      'cool': ['blue', 'green', 'purple', 'teal']
    };

    const hasNeutral = colors.some(color => colorGroups.neutral.includes(color));
    const hasWarm = colors.some(color => colorGroups.warm.includes(color));
    const hasCool = colors.some(color => colorGroups.cool.includes(color));

    if (hasNeutral && (hasWarm || hasCool)) return 90; // Neutral + accent
    if (hasWarm && hasCool) return 60; // Mixed warm/cool
    if (hasWarm || hasCool) return 80; // Consistent temperature
    return 70; // Default
  }

  // Generate style notes
  private static generateStyleNotes(items: any[], preferences: MorningPreferences): string[] {
    const notes: string[] = [];

    // Professional notes
    if (preferences.occasion === 'work') {
      notes.push("Professional and polished look");
      notes.push("Appropriate for business environment");
    }

    // Color notes
    const colors = items.map(item => item.color).filter(Boolean);
    if (colors.length > 0) {
      notes.push(`Sophisticated ${colors[0].toLowerCase()} color palette`);
    }

    // Material notes
    const materials = items.map(item => item.material).filter(Boolean);
    if (materials.includes('cotton')) {
      notes.push("Comfortable cotton blend for all-day wear");
    }

    return notes;
  }

  // Generate fit advice
  private static generateFitAdvice(items: any[]): string {
    const advice: string[] = [];

    items.forEach(item => {
      if (item.category === 'Tops' && item.subcategory === 'Shirt') {
        advice.push("Ensure shirt fits well at shoulders and chest");
      }
      if (item.category === 'Bottoms' && item.subcategory === 'Trousers') {
        advice.push("Trousers should have a clean, tailored fit");
      }
    });

    return advice.join('. ') || "Focus on clean lines and proper fit";
  }

  // Explain why the outfit works
  private static explainWhyItWorks(items: any[], preferences: MorningPreferences): string[] {
    const explanations: string[] = [];

    // Color explanation
    const colors = items.map(item => item.color).filter(Boolean);
    if (colors.length > 0) {
      explanations.push(`The ${colors[0].toLowerCase()} color creates a cohesive, professional look`);
    }

    // Occasion explanation
    if (preferences.occasion === 'work') {
      explanations.push("This combination strikes the perfect balance between professional and approachable");
    }

    // Weather explanation
    if (preferences.weather.temperature < 20) {
      explanations.push("The layering provides warmth while maintaining style");
    }

    // Material explanation
    const materials = items.map(item => item.material).filter(Boolean);
    if (materials.includes('cotton')) {
      explanations.push("Cotton materials ensure comfort throughout the day");
    }

    return explanations;
  }

  // Generate outfit summary
  private static generateSummary(items: any[], preferences: MorningPreferences): string {
    const categories = items.map(item => item.category).filter(Boolean);
    const colors = items.map(item => item.color).filter(Boolean);
    
    let summary = `A ${preferences.preferredFormality} look perfect for ${preferences.occasion}`;
    
    if (colors.length > 0) {
      summary += ` featuring a ${colors[0].toLowerCase()} color palette`;
    }
    
    summary += `. This combination of ${categories.join(', ').toLowerCase()} creates a polished, professional appearance.`;
    
    return summary;
  }
}

export default MorningCurationService;
