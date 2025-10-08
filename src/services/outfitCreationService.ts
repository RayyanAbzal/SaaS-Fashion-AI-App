// Outfit Creation Service - Handles outfit generation requests
import { OutfitCreationRequest, OutfitGenerationResult, OccasionConfig } from '../types';
import { OutfitGenerator } from './outfitGenerator';
import { OracleService } from './oracleService';

export class OutfitCreationService {
  // Get available occasions for outfit creation
  static getAvailableOccasions(): OccasionConfig[] {
    return [
      {
        id: 'casual',
        name: 'Casual',
        description: 'Everyday casual wear',
        icon: '👕',
        styleGuidelines: ['Comfortable', 'Relaxed', 'Versatile'],
        weatherConsiderations: ['All weather'],
        colorPalette: ['Blue', 'Gray', 'White', 'Black'],
        formality: 'casual',
      },
      {
        id: 'work',
        name: 'Work',
        description: 'Professional work attire',
        icon: '👔',
        styleGuidelines: ['Professional', 'Polished', 'Appropriate'],
        weatherConsiderations: ['Indoor climate'],
        colorPalette: ['Navy', 'Black', 'Gray', 'White'],
        formality: 'business',
      },
      {
        id: 'date',
        name: 'Date',
        description: 'Romantic date night outfit',
        icon: '💕',
        styleGuidelines: ['Attractive', 'Confident', 'Comfortable'],
        weatherConsiderations: ['Evening weather'],
        colorPalette: ['Red', 'Black', 'Navy', 'Burgundy'],
        formality: 'smart-casual',
      },
      {
        id: 'party',
        name: 'Party',
        description: 'Fun party or event outfit',
        icon: '🎉',
        styleGuidelines: ['Bold', 'Fun', 'Eye-catching'],
        weatherConsiderations: ['Indoor/outdoor'],
        colorPalette: ['Bright colors', 'Metallics', 'Bold patterns'],
        formality: 'party',
      },
      {
        id: 'formal',
        name: 'Formal',
        description: 'Formal event or special occasion',
        icon: '🎩',
        styleGuidelines: ['Elegant', 'Sophisticated', 'Timeless'],
        weatherConsiderations: ['Indoor climate'],
        colorPalette: ['Black', 'Navy', 'Charcoal', 'White'],
        formality: 'formal',
      },
    ];
  }

  // Generate outfits based on creation request
  static async generateOutfits(request: OutfitCreationRequest): Promise<OutfitGenerationResult> {
    try {
      // Get wardrobe items and retailer items
      const wardrobeItems = await OracleService.getRealWardrobeItems();
      const retailerItems = OracleService.getRetailerItems();
      const allItems = [...wardrobeItems, ...retailerItems];

      if (allItems.length === 0) {
        return {
          outfits: [],
          analysis: {
            selectedItemsAnalysis: 'No items available for outfit generation',
            colorHarmony: {
              scheme: 'none',
              score: 0,
              dominantColor: 'Unknown',
              styleTips: ['Add items to your wardrobe to generate outfits'],
            },
            styleCompatibility: 0,
            weatherAppropriateness: 0,
            occasionFit: 0,
          },
          recommendations: {
            missingCategories: ['tops', 'bottoms', 'shoes'],
            suggestedColors: ['Blue', 'Black', 'White', 'Gray'],
            styleTips: ['Add basic wardrobe items to get started'],
          },
        };
      }

      // Generate outfit combinations
      const outfitCombinations = OutfitGenerator.generateOutfitCombinations(
        allItems,
        request.occasion,
        request.weather ? `${request.weather.temperature}°` : '22°',
        request.aiPreferences?.maxOutfits || 3
      );

      // Convert to OutfitSuggestion format
      const outfits = outfitCombinations.map(combination => ({
        id: combination.id,
        items: combination.items,
        reasoning: combination.summary,
        occasion: combination.occasion,
        weather: [combination.weather],
        confidence: combination.confidence / 100,
        styleNotes: combination.styleNotes,
        colorHarmony: {
          scheme: 'analogous' as const,
          score: combination.confidence / 100,
          dominantColor: combination.colorHarmony || 'Unknown',
          styleTips: combination.whyItWorks || [],
        },
      }));

      return {
        outfits,
        analysis: {
          selectedItemsAnalysis: `Generated ${outfits.length} outfit combinations for ${request.occasion}`,
          colorHarmony: {
            scheme: 'analogous',
            score: 0.8,
            dominantColor: 'Mixed',
            styleTips: ['Colors work well together', 'Good contrast achieved'],
          },
          styleCompatibility: 0.85,
          weatherAppropriateness: request.weather ? 0.9 : 0.7,
          occasionFit: 0.9,
        },
        recommendations: {
          missingCategories: [],
          suggestedColors: ['Blue', 'Black', 'White', 'Gray'],
          styleTips: ['Great outfit combinations generated!', 'Consider adding accessories'],
        },
      };
    } catch (error) {
      console.error('Error generating outfits:', error);
      throw new Error('Failed to generate outfits. Please try again.');
    }
  }
}

export default OutfitCreationService;
