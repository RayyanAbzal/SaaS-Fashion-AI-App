// Smart Outfit Generator
// Considers color combinations, weather, occasion, and material suitability

export interface WeatherData {
  temperature: number;
  condition: string; // 'sunny', 'rainy', 'cloudy', 'windy'
  humidity: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
}

export interface MaterialProperties {
  name: string;
  breathability: number; // 1-10 (10 = most breathable)
  warmth: number; // 1-10 (10 = warmest)
  waterResistance: number; // 1-10 (10 = most water resistant)
  seasonality: string[]; // ['spring', 'summer', 'autumn', 'winter']
  formality: 'casual' | 'smart-casual' | 'business' | 'formal';
}

export interface ColorAnalysis {
  primary: string;
  secondary: string;
  harmony: 'monochromatic' | 'complementary' | 'analogous' | 'triadic' | 'neutral';
  seasonality: string[];
  formality: 'casual' | 'smart-casual' | 'business' | 'formal';
  skinToneCompatibility: string[];
}

export interface SmartOutfitItem {
  id: string;
  name: string;
  image: string;
  category: string;
  color: string;
  brand: string;
  price?: string;
  isFromWardrobe: boolean;
  subcategory: string;
  tags: string[];
  material: string;
  materialProperties: MaterialProperties;
  colorAnalysis: ColorAnalysis;
  weatherSuitability: {
    minTemp: number;
    maxTemp: number;
    conditions: string[];
    seasonality: string[];
  };
  occasionSuitability: string[];
}

class SmartOutfitGenerator {
  // Material database with properties
  private static materials: { [key: string]: MaterialProperties } = {
    'cotton': {
      name: 'Cotton',
      breathability: 9,
      warmth: 3,
      waterResistance: 2,
      seasonality: ['spring', 'summer', 'autumn'],
      formality: 'casual'
    },
    'linen': {
      name: 'Linen',
      breathability: 10,
      warmth: 2,
      waterResistance: 1,
      seasonality: ['spring', 'summer'],
      formality: 'casual'
    },
    'wool': {
      name: 'Wool',
      breathability: 6,
      warmth: 8,
      waterResistance: 5,
      seasonality: ['autumn', 'winter'],
      formality: 'smart-casual'
    },
    'cashmere': {
      name: 'Cashmere',
      breathability: 7,
      warmth: 9,
      waterResistance: 3,
      seasonality: ['autumn', 'winter'],
      formality: 'business'
    },
    'silk': {
      name: 'Silk',
      breathability: 8,
      warmth: 4,
      waterResistance: 2,
      seasonality: ['spring', 'summer', 'autumn'],
      formality: 'business'
    },
    'denim': {
      name: 'Denim',
      breathability: 5,
      warmth: 4,
      waterResistance: 3,
      seasonality: ['spring', 'summer', 'autumn', 'winter'],
      formality: 'casual'
    },
    'leather': {
      name: 'Leather',
      breathability: 2,
      warmth: 6,
      waterResistance: 8,
      seasonality: ['autumn', 'winter'],
      formality: 'smart-casual'
    },
    'polyester': {
      name: 'Polyester',
      breathability: 4,
      warmth: 5,
      waterResistance: 6,
      seasonality: ['spring', 'summer', 'autumn', 'winter'],
      formality: 'casual'
    },
    'viscose': {
      name: 'Viscose',
      breathability: 7,
      warmth: 4,
      waterResistance: 3,
      seasonality: ['spring', 'summer', 'autumn'],
      formality: 'smart-casual'
    }
  };

  // Color harmony analysis
  private static analyzeColorHarmony(items: SmartOutfitItem[]): ColorAnalysis {
    const colors = items.map(item => item.color.toLowerCase());
    const primary = colors[0];
    const secondary = colors[1] || primary;

    // Basic color harmony rules
    let harmony: ColorAnalysis['harmony'] = 'neutral';
    
    if (colors.every(color => color === primary)) {
      harmony = 'monochromatic';
    } else if (this.areComplementary(primary, secondary)) {
      harmony = 'complementary';
    } else if (this.areAnalogous(primary, secondary)) {
      harmony = 'analogous';
    }

    return {
      primary,
      secondary,
      harmony,
      seasonality: this.getColorSeasonality(colors),
      formality: this.getColorFormality(colors),
      skinToneCompatibility: this.getSkinToneCompatibility(colors)
    };
  }

  // Check if colors are complementary
  private static areComplementary(color1: string, color2: string): boolean {
    const complementaryPairs = [
      ['red', 'green'],
      ['blue', 'orange'],
      ['yellow', 'purple'],
      ['black', 'white'],
      ['navy', 'camel'],
      ['white', 'navy']
    ];
    
    return complementaryPairs.some(pair => 
      (pair.includes(color1) && pair.includes(color2))
    );
  }

  // Check if colors are analogous
  private static areAnalogous(color1: string, color2: string): boolean {
    const analogousGroups = [
      ['red', 'orange', 'yellow'],
      ['blue', 'green', 'teal'],
      ['purple', 'blue', 'indigo'],
      ['white', 'cream', 'beige'],
      ['black', 'grey', 'charcoal']
    ];
    
    return analogousGroups.some(group => 
      group.includes(color1) && group.includes(color2)
    );
  }

  // Get color seasonality
  private static getColorSeasonality(colors: string[]): string[] {
    const seasonalColors = {
      spring: ['pastel', 'light', 'fresh', 'mint', 'coral'],
      summer: ['bright', 'white', 'light', 'vibrant', 'turquoise'],
      autumn: ['warm', 'earth', 'brown', 'orange', 'burgundy'],
      winter: ['dark', 'deep', 'black', 'navy', 'jewel']
    };

    const seasons: string[] = [];
    colors.forEach(color => {
      Object.entries(seasonalColors).forEach(([season, colorWords]) => {
        if (colorWords.some(word => color.includes(word))) {
          seasons.push(season);
        }
      });
    });

    return [...new Set(seasons)];
  }

  // Get color formality
  private static getColorFormality(colors: string[]): 'casual' | 'smart-casual' | 'business' | 'formal' {
    const formalColors = ['black', 'navy', 'white', 'charcoal', 'camel'];
    const casualColors = ['bright', 'neon', 'patterned', 'colorful'];
    
    if (colors.some(color => casualColors.some(casual => color.includes(casual)))) {
      return 'casual';
    }
    
    if (colors.every(color => formalColors.some(formal => color.includes(formal)))) {
      return 'formal';
    }
    
    return 'smart-casual';
  }

  // Get skin tone compatibility
  private static getSkinToneCompatibility(colors: string[]): string[] {
    // Simplified skin tone compatibility
    const warmTones = ['warm', 'peach', 'golden', 'olive'];
    const coolTones = ['cool', 'pink', 'blue', 'ash'];
    
    return colors.some(color => warmTones.some(tone => color.includes(tone))) 
      ? ['warm', 'neutral'] 
      : ['cool', 'neutral'];
  }

  // Check weather suitability
  private static isWeatherSuitable(item: SmartOutfitItem, weather: WeatherData): boolean {
    const { materialProperties, weatherSuitability } = item;
    
    // Temperature check
    if (weather.temperature < weatherSuitability.minTemp || 
        weather.temperature > weatherSuitability.maxTemp) {
      return false;
    }

    // Season check
    if (!weatherSuitability.seasonality.includes(weather.season)) {
      return false;
    }

    // Weather condition check
    if (weather.condition === 'rainy' && materialProperties.waterResistance < 5) {
      return false;
    }

    if (weather.condition === 'sunny' && materialProperties.breathability < 6) {
      return false;
    }

    return true;
  }

  // Check occasion suitability
  private static isOccasionSuitable(item: SmartOutfitItem, occasion: string): boolean {
    return item.occasionSuitability.includes(occasion);
  }

  // Generate smart outfit combinations
  static async generateSmartOutfits(
    occasion: string,
    weather: WeatherData,
    wardrobeItems: SmartOutfitItem[],
    retailerItems: SmartOutfitItem[],
    count: number = 3
  ): Promise<any[]> {
    const allItems = [...wardrobeItems, ...retailerItems];
    const suitableItems = allItems.filter(item => 
      this.isWeatherSuitable(item, weather) && 
      this.isOccasionSuitable(item, occasion)
    );

    console.log(`Found ${suitableItems.length} weather and occasion suitable items`);

    const outfits = [];
    const categories = ['tops', 'bottoms', 'shoes', 'accessories'];

    for (let i = 0; i < count; i++) {
      const outfit = this.createSmartOutfit(suitableItems, occasion, weather, categories);
      if (outfit) {
        outfits.push(outfit);
      }
    }

    return outfits;
  }

  // Create a single smart outfit
  private static createSmartOutfit(
    items: SmartOutfitItem[],
    occasion: string,
    weather: WeatherData,
    categories: string[]
  ): any | null {
    const outfitItems: SmartOutfitItem[] = [];
    
    // Select one item from each category
    categories.forEach(category => {
      const categoryItems = items.filter(item => 
        item.category.toLowerCase().includes(category) &&
        !outfitItems.some(selected => selected.category === item.category)
      );
      
      if (categoryItems.length > 0) {
        const randomItem = categoryItems[Math.floor(Math.random() * categoryItems.length)];
        outfitItems.push(randomItem);
      }
    });

    if (outfitItems.length < 2) return null;

    // Analyze the outfit
    const colorAnalysis = this.analyzeColorHarmony(outfitItems);
    const materialCompatibility = this.analyzeMaterialCompatibility(outfitItems, weather);
    const confidence = this.calculateConfidence(outfitItems, occasion, weather, colorAnalysis);

    return {
      id: `smart-outfit-${Date.now()}`,
      items: outfitItems,
      summary: this.generateOutfitSummary(outfitItems, occasion, weather, colorAnalysis),
      confidence,
      occasion,
      weather: `${weather.temperature}°C, ${weather.condition}`,
      colorHarmony: this.generateColorHarmonyText(colorAnalysis),
      materialAdvice: this.generateMaterialAdvice(materialCompatibility, weather),
      styleNotes: this.generateStyleNotes(outfitItems, occasion, weather),
      fitAdvice: this.generateFitAdvice(outfitItems, occasion),
      whyItWorks: this.generateWhyItWorks(outfitItems, occasion, weather, colorAnalysis)
    };
  }

  // Analyze material compatibility
  private static analyzeMaterialCompatibility(items: SmartOutfitItem[], weather: WeatherData): any {
    const materials = items.map(item => item.materialProperties);
    const avgBreathability = materials.reduce((sum, mat) => sum + mat.breathability, 0) / materials.length;
    const avgWarmth = materials.reduce((sum, mat) => sum + mat.warmth, 0) / materials.length;
    const avgWaterResistance = materials.reduce((sum, mat) => sum + mat.waterResistance, 0) / materials.length;

    return {
      breathability: avgBreathability,
      warmth: avgWarmth,
      waterResistance: avgWaterResistance,
      seasonality: [...new Set(materials.flatMap(mat => mat.seasonality))],
      formality: materials.map(mat => mat.formality)
    };
  }

  // Calculate confidence score
  private static calculateConfidence(
    items: SmartOutfitItem[],
    occasion: string,
    weather: WeatherData,
    colorAnalysis: ColorAnalysis
  ): number {
    let confidence = 70; // Base confidence

    // Color harmony bonus
    if (colorAnalysis.harmony !== 'neutral') confidence += 10;
    if (colorAnalysis.harmony === 'complementary') confidence += 5;

    // Weather suitability bonus
    const weatherSuitable = items.every(item => this.isWeatherSuitable(item, weather));
    if (weatherSuitable) confidence += 15;

    // Occasion suitability bonus
    const occasionSuitable = items.every(item => this.isOccasionSuitable(item, occasion));
    if (occasionSuitable) confidence += 10;

    // Material compatibility bonus
    const materials = items.map(item => item.materialProperties);
    const seasonMatch = materials.every(mat => mat.seasonality.includes(weather.season));
    if (seasonMatch) confidence += 5;

    return Math.min(confidence, 100);
  }

  // Generate outfit summary
  private static generateOutfitSummary(
    items: SmartOutfitItem[],
    occasion: string,
    weather: WeatherData,
    colorAnalysis: ColorAnalysis
  ): string {
    const itemNames = items.map(item => item.name).join(', ');
    const weatherText = weather.temperature > 25 ? 'perfect for warm weather' : 
                       weather.temperature < 15 ? 'ideal for cooler temperatures' : 
                       'great for mild weather';
    
    return `A ${colorAnalysis.harmony} color scheme that's ${weatherText} and perfect for ${occasion}. Features ${itemNames} with excellent material compatibility for the current conditions.`;
  }

  // Generate color harmony text
  private static generateColorHarmonyText(colorAnalysis: ColorAnalysis): string {
    const harmonyDescriptions = {
      monochromatic: 'Monochromatic color scheme creates a sophisticated, cohesive look',
      complementary: 'Complementary colors create visual interest and balance',
      analogous: 'Analogous colors create a harmonious, flowing appearance',
      triadic: 'Triadic color scheme creates vibrant, balanced contrast',
      neutral: 'Neutral color palette provides versatility and timeless appeal'
    };

    return harmonyDescriptions[colorAnalysis.harmony] || harmonyDescriptions.neutral;
  }

  // Generate material advice
  private static generateMaterialAdvice(compatibility: any, weather: WeatherData): string {
    if (weather.temperature > 25 && compatibility.breathability < 6) {
      return 'Consider lighter, more breathable materials for hot weather comfort';
    }
    if (weather.temperature < 15 && compatibility.warmth < 6) {
      return 'Add layers or choose warmer materials for cooler temperatures';
    }
    if (weather.condition === 'rainy' && compatibility.waterResistance < 5) {
      return 'Consider water-resistant materials or bring an umbrella';
    }
    return 'Materials are well-suited for current weather conditions';
  }

  // Generate style notes
  private static generateStyleNotes(
    items: SmartOutfitItem[],
    occasion: string,
    weather: WeatherData
  ): string[] {
    const notes = [];
    
    // Weather-specific notes
    if (weather.temperature > 25) {
      notes.push('Light, breathable materials keep you cool in warm weather');
    }
    if (weather.temperature < 15) {
      notes.push('Layered pieces provide warmth while maintaining style');
    }
    if (weather.condition === 'rainy') {
      notes.push('Water-resistant materials protect against the elements');
    }

    // Occasion-specific notes
    if (occasion === 'work' || occasion === 'business') {
      notes.push('Professional styling appropriate for workplace environment');
    }
    if (occasion === 'casual') {
      notes.push('Comfortable, relaxed styling perfect for everyday wear');
    }
    if (occasion === 'date' || occasion === 'party') {
      notes.push('Stylish details that make a statement for special occasions');
    }

    return notes;
  }

  // Generate fit advice
  private static generateFitAdvice(items: SmartOutfitItem[], occasion: string): string {
    if (occasion === 'work' || occasion === 'business') {
      return 'Ensure proper fit and tailoring for a professional appearance';
    }
    if (occasion === 'casual') {
      return 'Comfortable fit that allows for easy movement and relaxation';
    }
    if (occasion === 'date' || occasion === 'party') {
      return 'Choose flattering silhouettes that highlight your best features';
    }
    return 'Select pieces that fit well and make you feel confident';
  }

  // Generate detailed why it works reasoning
  private static generateWhyItWorks(
    items: SmartOutfitItem[],
    occasion: string,
    weather: WeatherData,
    colorAnalysis: ColorAnalysis
  ): string[] {
    const reasons = [];
    const temp = weather.temperature;
    const condition = weather.condition?.toLowerCase() || '';
    
    // Color harmony reasoning
    if (colorAnalysis.harmony === 'complementary') {
      reasons.push(`The complementary color scheme (${colorAnalysis.primaryColor} and ${colorAnalysis.secondaryColor || 'accent'}) creates visual interest while maintaining balance - perfect for making a statement`);
    } else if (colorAnalysis.harmony === 'monochromatic') {
      reasons.push(`The monochromatic ${colorAnalysis.primaryColor} palette creates a sophisticated, cohesive look that elongates your silhouette and appears effortlessly polished`);
    } else if (colorAnalysis.harmony === 'neutral') {
      reasons.push(`The neutral color palette provides maximum versatility - these pieces work together seamlessly and can be mixed with other items in your wardrobe`);
    } else if (colorAnalysis.harmony === 'analogous') {
      reasons.push(`The harmonious color combination creates a flowing, cohesive appearance that's easy on the eyes and feels naturally put together`);
    }

    // Weather-specific reasoning
    if (temp > 25) {
      const breathableItems = items.filter(item => item.materialProperties?.breathability >= 7);
      if (breathableItems.length > 0) {
        reasons.push(`Light, breathable materials (${breathableItems.map(i => i.material || 'fabric').join(', ')}) keep you cool and comfortable in ${temp}°C weather`);
      } else {
        reasons.push(`The outfit is designed for warm weather - lighter fabrics and relaxed fits prevent overheating in ${temp}°C temperatures`);
      }
    } else if (temp < 15) {
      const warmItems = items.filter(item => item.materialProperties?.warmth >= 7);
      if (warmItems.length > 0) {
        reasons.push(`Layered pieces with insulating materials (${warmItems.map(i => i.material || 'fabric').join(', ')}) provide warmth without bulk in ${temp}°C weather`);
      } else {
        reasons.push(`The combination creates effective layering that traps body heat, keeping you warm in cooler ${temp}°C temperatures`);
      }
    } else {
      reasons.push(`The materials and layering are perfectly balanced for ${temp}°C - comfortable without being too warm or too cool`);
    }

    // Weather condition reasoning
    if (condition.includes('rain')) {
      const waterResistant = items.some(item => item.materialProperties?.waterResistance >= 6);
      if (waterResistant) {
        reasons.push(`Water-resistant materials protect you from the rain while maintaining style - practical and fashionable`);
      } else {
        reasons.push(`Consider adding a water-resistant layer for rainy conditions, but the base outfit works well for indoor transitions`);
      }
    } else if (condition.includes('sun') || condition.includes('clear')) {
      reasons.push(`The outfit is perfect for sunny conditions - colors and materials won't fade or overheat in direct sunlight`);
    }

    // Occasion-specific reasoning
    if (occasion === 'work' || occasion === 'professional') {
      const hasBlazer = items.some(item => item.category?.toLowerCase().includes('blazer') || item.name?.toLowerCase().includes('blazer'));
      if (hasBlazer) {
        reasons.push(`Professional styling with structured pieces (like the blazer) elevates the look for workplace environments while remaining comfortable`);
      } else {
        reasons.push(`The combination strikes the right balance between professional and approachable - appropriate for office settings while maintaining personal style`);
      }
    } else if (occasion === 'casual') {
      reasons.push(`Comfortable, versatile pieces perfect for everyday activities - easy to move in and suitable for various casual settings`);
    } else if (occasion === 'date') {
      reasons.push(`Stylish details and flattering silhouettes make this perfect for a date - confident and put-together without being overdone`);
    } else if (occasion === 'party') {
      reasons.push(`The outfit makes a statement perfect for parties - eye-catching elements that stand out in social settings`);
    }

    // Material compatibility reasoning
    const materials = items.map(item => item.materialProperties);
    const seasonMatch = materials.every(mat => mat?.seasonality?.includes(weather.season));
    if (seasonMatch) {
      reasons.push(`All materials are seasonally appropriate for ${weather.season} - ensuring comfort and style alignment with the weather`);
    }

    // Fit and silhouette reasoning
    const hasFitted = items.some(item => item.fit === 'fitted' || item.fit === 'slim');
    const hasRelaxed = items.some(item => item.fit === 'relaxed' || item.fit === 'loose');
    if (hasFitted && hasRelaxed) {
      reasons.push(`The balanced fit combination (fitted and relaxed pieces) creates a flattering silhouette that's both comfortable and stylish`);
    } else if (hasFitted) {
      reasons.push(`The fitted silhouette creates a polished, put-together appearance that's flattering and professional`);
    } else if (hasRelaxed) {
      reasons.push(`The relaxed fit prioritizes comfort while maintaining style - perfect for all-day wear`);
    }

    // Ensure we have at least 3 reasons
    if (reasons.length < 3) {
      reasons.push(`This combination works well together - the pieces complement each other in style, color, and occasion appropriateness`);
    }

    return reasons.slice(0, 4); // Return top 4 reasons
  }
}

export default SmartOutfitGenerator;
