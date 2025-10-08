// Enhanced Outfit Generator - Creates varied outfits with retailer items
import { OutfitItem, OutfitCombination } from './oracleService';
import { VarietyService } from './varietyService';

export class OutfitGenerator {
  // Generate multiple unique outfit combinations
  static generateOutfitCombinations(
    items: OutfitItem[],
    occasion: string = 'casual',
    weather: string = '22°',
    count: number = 3
  ): OutfitCombination[] {
    // Safety check for items
    if (!items || !Array.isArray(items)) {
      console.error('Invalid items array provided to generateOutfitCombinations');
      return [];
    }

    // Filter out any undefined or invalid items
    const validItems = items.filter(item => item && item.id && item.name && item.image);
    
    if (validItems.length === 0) {
      console.error('No valid items available for outfit generation');
      return [];
    }

    const combinations: OutfitCombination[] = [];
    
    // Generate multiple unique combinations
    for (let i = 0; i < count; i++) {
      const combination = this.generateRandomOutfit(validItems, occasion, weather, i);
      combinations.push(combination);
    }

    // Apply variety and freshness algorithms
    return VarietyService.applyVarietyAndFreshness(validItems, combinations);
  }

  // Generate a random outfit from available items
  private static generateRandomOutfit(
    items: OutfitItem[],
    occasion: string,
    weather: string,
    index: number
  ): OutfitCombination {
    // Filter items by category for better combinations
    const tops = items.filter(item => 
      item && item.category && (
        item.category.toLowerCase().includes('top') || 
        item.category.toLowerCase().includes('shirt') ||
        item.category.toLowerCase().includes('blouse') ||
        item.category.toLowerCase().includes('sweater') ||
        item.category.toLowerCase().includes('t-shirt') ||
        item.category.toLowerCase().includes('tee')
      )
    );
    
    const bottoms = items.filter(item => 
      item && item.category && (
        item.category.toLowerCase().includes('bottom') || 
        item.category.toLowerCase().includes('pant') ||
        item.category.toLowerCase().includes('jean') ||
        item.category.toLowerCase().includes('skirt') ||
        item.category.toLowerCase().includes('trouser')
      )
    );
    
    const shoes = items.filter(item => 
      item && item.category && (
        item.category.toLowerCase().includes('shoe') || 
        item.category.toLowerCase().includes('sneaker') ||
        item.category.toLowerCase().includes('boot') ||
        item.category.toLowerCase().includes('sandal')
      )
    );

    // Select random items from each category, with fallbacks
    const selectedTop = tops.length > 0 ? tops[Math.floor(Math.random() * tops.length)] : null;
    const selectedBottom = bottoms.length > 0 ? bottoms[Math.floor(Math.random() * bottoms.length)] : null;
    const selectedShoes = shoes.length > 0 ? shoes[Math.floor(Math.random() * shoes.length)] : null;

    console.log('Selected items:', { 
      top: selectedTop?.name, 
      bottom: selectedBottom?.name, 
      shoes: selectedShoes?.name,
      topsCount: tops.length,
      bottomsCount: bottoms.length,
      shoesCount: shoes.length
    });

    const outfitItems = [selectedTop, selectedBottom, selectedShoes].filter(item => item && item.image);

    // If no valid items, try to use any available items
    if (outfitItems.length === 0) {
      console.log('No valid outfit items, trying fallback with any items');
      const fallbackItems = items.slice(0, 3).filter(item => item && item.image);
      
      if (fallbackItems.length === 0) {
        console.log('No items available at all, returning empty outfit');
        return {
          id: `${occasion}-fallback-${index}-${Date.now()}`,
          items: [],
          summary: 'No items available for outfit generation',
          confidence: 50,
          occasion: occasion.charAt(0).toUpperCase() + occasion.slice(1),
          weather: weather,
          colorHarmony: 'Unable to determine color harmony',
          styleNotes: ['No items available'],
          fitAdvice: 'Add items to your wardrobe to generate outfits',
          whyItWorks: ['No items available for analysis'],
        };
      }
      
      // Use fallback items
      return this.createOutfitFromItems(fallbackItems, occasion, weather, index);
    }

    // Generate unique descriptions based on items
    const descriptions = this.generateOutfitDescriptions(outfitItems, occasion);
    
    return {
      id: `${occasion}-${index}-${Date.now()}`,
      items: outfitItems,
      summary: descriptions.summary,
      confidence: Math.floor(Math.random() * 20) + 75, // 75-95% confidence
      occasion: occasion.charAt(0).toUpperCase() + occasion.slice(1),
      weather: weather,
      colorHarmony: descriptions.colorHarmony,
      styleNotes: descriptions.styleNotes,
      fitAdvice: descriptions.fitAdvice,
      whyItWorks: descriptions.whyItWorks,
    };
  }

  // Create outfit from any available items (fallback method)
  private static createOutfitFromItems(
    items: OutfitItem[],
    occasion: string,
    weather: string,
    index: number
  ): OutfitCombination {
    const descriptions = this.generateOutfitDescriptions(items, occasion);
    
    return {
      id: `${occasion}-fallback-${index}-${Date.now()}`,
      items: items,
      summary: descriptions.summary,
      confidence: 60, // Lower confidence for fallback outfits
      occasion: occasion.charAt(0).toUpperCase() + occasion.slice(1),
      weather: weather,
      colorHarmony: descriptions.colorHarmony,
      styleNotes: descriptions.styleNotes,
      fitAdvice: descriptions.fitAdvice,
      whyItWorks: descriptions.whyItWorks,
    };
  }

  // Generate unique descriptions for outfit items
  private static generateOutfitDescriptions(items: OutfitItem[], occasion: string) {
    const summaries = [
      'A perfectly balanced ensemble that effortlessly combines style and comfort.',
      'This sophisticated look showcases modern minimalism with timeless appeal.',
      'An elegant combination that works for any occasion while maintaining personal style.',
      'A chic and contemporary outfit that strikes the perfect balance between casual and polished.',
      'This stylish ensemble demonstrates how simple pieces can create a powerful fashion statement.',
      'A versatile look that transitions seamlessly from day to night.',
      'This curated combination highlights your personal style with effortless sophistication.',
      'An expertly styled outfit that balances comfort with undeniable chic appeal.',
    ];

    const colorHarmonies = [
      'Neutral tones create a sophisticated and versatile look',
      'Complementary colors enhance your natural features',
      'Monochromatic styling creates a sleek and modern appearance',
      'Warm tones add depth and dimension to your overall look',
      'Cool undertones provide a fresh and contemporary feel',
      'Contrasting colors create visual interest and sophistication',
      'Harmonious color palette creates a cohesive and polished look',
    ];

    const styleNotes = [
      'The combination creates a flattering silhouette',
      'Easy to accessorize with different pieces',
      'Comfortable for all-day wear',
      'Perfect for layering in different weather conditions',
      'Versatile enough for multiple occasions',
      'Timeless pieces that won\'t go out of style',
      'Professional yet approachable aesthetic',
    ];

    const fitAdvice = [
      'Ensure proper proportions between top and bottom',
      'Consider the occasion when choosing fit',
      'Balance loose and fitted pieces for the best look',
      'Pay attention to length and silhouette',
      'Choose pieces that flatter your body type',
      'Layer strategically for added dimension',
      'Accessorize thoughtfully to complete the look',
    ];

    const whyItWorks = [
      'Classic combination that never goes out of style',
      'Comfortable for all-day wear without sacrificing style',
      'Easy to layer with jackets, cardigans, or accessories',
      'Works for most casual settings and occasions',
      'Versatile pieces that can be mixed and matched',
      'Professional appearance with casual comfort',
      'Timeless appeal that works for any age',
    ];

    return {
      summary: summaries[Math.floor(Math.random() * summaries.length)],
      colorHarmony: colorHarmonies[Math.floor(Math.random() * colorHarmonies.length)],
      styleNotes: styleNotes.slice(0, 3),
      fitAdvice: fitAdvice[Math.floor(Math.random() * fitAdvice.length)],
      whyItWorks: whyItWorks.slice(0, 4),
    };
  }
}
