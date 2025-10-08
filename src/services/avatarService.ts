// Virtual Avatar Service - Body type analysis and fit prediction
import { UserAvatar, FitPrediction } from './enhancedOracleService';

export interface BodyMeasurement {
  height: number;
  weight: number;
  waist: number;
}

export interface FitAnalysis {
  overall: 'perfect' | 'good' | 'tight' | 'loose';
  specificAreas: {
    waist: 'snug' | 'comfortable' | 'loose';
    bust: 'snug' | 'comfortable' | 'loose';
    hips: 'snug' | 'comfortable' | 'loose';
  };
  confidence: number;
  recommendations: string[];
  bodyFlattery: string;
}

export interface SizeRecommendation {
  size: string;
  confidence: number;
  reason: string;
  alternatives: string[];
}

export class AvatarService {
  // Determine body type from measurements (simplified)
  static determineBodyType(measurements: BodyMeasurement, userBodyType?: string): 'pear' | 'apple' | 'hourglass' | 'rectangle' {
    // If user selected body type, use that
    if (userBodyType && ['pear', 'apple', 'hourglass', 'rectangle'].includes(userBodyType)) {
      return userBodyType as 'pear' | 'apple' | 'hourglass' | 'rectangle';
    }
    
    // Fallback: use waist size as a rough indicator
    const { waist } = measurements;
    
    if (waist < 28) {
      return 'rectangle'; // Smaller frame
    } else if (waist < 32) {
      return 'hourglass'; // Medium frame
    } else if (waist < 36) {
      return 'pear'; // Larger frame
    } else {
      return 'apple'; // Largest frame
    }
  }

  // Create user avatar from measurements
  static createAvatar(measurements: BodyMeasurement, fitPreferences?: {
    bodyType?: string;
    preferredFit: 'snug' | 'comfortable' | 'loose';
    problemAreas: string[];
  }): UserAvatar {
    const bodyType = this.determineBodyType(measurements, fitPreferences?.bodyType);
    
    return {
      id: `avatar_${Date.now()}`,
      bodyType,
      measurements: {
        height: measurements.height,
        weight: measurements.weight,
        waist: measurements.waist,
      },
      fitPreferences: {
        preferredFit: fitPreferences?.preferredFit || 'comfortable',
        problemAreas: fitPreferences?.problemAreas || [],
      },
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
  }

  // Predict fit for a specific item
  static predictFit(
    item: {
      category: string;
      subcategory: string;
      sizes: string[];
      brand: string;
    },
    avatar: UserAvatar,
    selectedSize?: string
  ): FitPrediction {
    const { bodyType, measurements, fitPreferences } = avatar;
    const { category, subcategory } = item;
    
    // Mock fit prediction algorithm (in real app, this would use ML)
    let overall: 'perfect' | 'good' | 'tight' | 'loose' = 'good';
    let confidence = 75;
    const recommendations: string[] = [];
    
    // Analyze based on body type and item category
    if (category.toLowerCase() === 'tops') {
      if (bodyType === 'apple') {
        overall = 'tight';
        confidence = 60;
        recommendations.push('Consider sizing up for comfort around the waist');
        recommendations.push('Look for tops with stretch or relaxed fit');
      } else if (bodyType === 'pear') {
        overall = 'good';
        confidence = 85;
        recommendations.push('This will flatter your upper body');
        recommendations.push('Consider tucking in to define your waist');
      } else if (bodyType === 'hourglass') {
        overall = 'perfect';
        confidence = 90;
        recommendations.push('This will accentuate your curves beautifully');
      }
    } else if (category.toLowerCase() === 'bottoms') {
      if (bodyType === 'pear') {
        overall = 'tight';
        confidence = 65;
        recommendations.push('Consider sizing up for comfort around the hips');
        recommendations.push('Look for high-waisted styles to elongate your legs');
      } else if (bodyType === 'apple') {
        overall = 'good';
        confidence = 80;
        recommendations.push('This will balance your proportions');
        recommendations.push('Consider a slightly looser fit for comfort');
      } else if (bodyType === 'hourglass') {
        overall = 'perfect';
        confidence = 95;
        recommendations.push('This will highlight your waist perfectly');
      }
    } else if (category.toLowerCase() === 'dresses') {
      if (bodyType === 'rectangle') {
        overall = 'good';
        confidence = 85;
        recommendations.push('Add a belt to create waist definition');
        recommendations.push('Look for dresses with ruching or draping');
      } else if (bodyType === 'hourglass') {
        overall = 'perfect';
        confidence = 95;
        recommendations.push('This will showcase your curves beautifully');
      }
    }
    
    // Adjust based on fit preferences
    if (fitPreferences.preferredFit === 'snug' && overall === 'good') {
      overall = 'tight';
      confidence -= 10;
    } else if (fitPreferences.preferredFit === 'loose' && overall === 'good') {
      overall = 'loose';
      confidence -= 5;
    }
    
    // Generate specific area analysis
    const specificAreas = {
      waist: this.analyzeWaistFit(bodyType, measurements, category),
      bust: this.analyzeBustFit(bodyType, measurements, category),
      hips: this.analyzeHipFit(bodyType, measurements, category),
    };
    
    return {
      overall,
      specificAreas,
      confidence: Math.max(confidence, 50),
      recommendations,
    };
  }

  // Analyze waist fit
  private static analyzeWaistFit(
    bodyType: string,
    measurements: { height: number; weight: number; waist: number },
    category: string
  ): 'snug' | 'comfortable' | 'loose' {
    if (bodyType === 'apple') {
      return category.toLowerCase() === 'tops' ? 'snug' : 'comfortable';
    } else if (bodyType === 'hourglass') {
      return 'comfortable';
    } else if (bodyType === 'pear') {
      return 'comfortable';
    }
    return 'comfortable';
  }

  // Analyze bust fit
  private static analyzeBustFit(
    bodyType: string,
    measurements: { height: number; weight: number; waist: number },
    category: string
  ): 'snug' | 'comfortable' | 'loose' {
    if (bodyType === 'apple') {
      return 'snug';
    } else if (bodyType === 'pear') {
      return 'loose';
    } else if (bodyType === 'hourglass') {
      return 'comfortable';
    }
    return 'comfortable';
  }

  // Analyze hip fit
  private static analyzeHipFit(
    bodyType: string,
    measurements: { height: number; weight: number; waist: number },
    category: string
  ): 'snug' | 'comfortable' | 'loose' {
    if (bodyType === 'pear') {
      return category.toLowerCase() === 'bottoms' ? 'snug' : 'comfortable';
    } else if (bodyType === 'apple') {
      return 'loose';
    } else if (bodyType === 'hourglass') {
      return 'comfortable';
    }
    return 'comfortable';
  }

  // Get size recommendation
  static getSizeRecommendation(
    item: {
      category: string;
      subcategory: string;
      sizes: string[];
      brand: string;
    },
    avatar: UserAvatar
  ): SizeRecommendation {
    const { bodyType, measurements } = avatar;
    const { sizes, brand } = item;
    
    // Mock size recommendation (in real app, this would use brand-specific sizing data)
    let recommendedSize = 'M';
    let confidence = 75;
    const reason = this.getSizeReason(bodyType, brand);
    let alternatives: string[] = [];
    
    // Adjust based on body type
    if (bodyType === 'apple') {
      recommendedSize = 'L';
      alternatives = ['XL', 'M'];
      confidence = 80;
    } else if (bodyType === 'pear') {
      recommendedSize = 'M';
      alternatives = ['L', 'S'];
      confidence = 85;
    } else if (bodyType === 'hourglass') {
      recommendedSize = 'M';
      alternatives = ['S', 'L'];
      confidence = 90;
    } else if (bodyType === 'rectangle') {
      recommendedSize = 'M';
      alternatives = ['S', 'L'];
      confidence = 85;
    }
    
    // Filter to available sizes
    const availableSizes = sizes.filter(size => 
      ['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(size)
    );
    
    if (availableSizes.length > 0) {
      // Find closest available size
      const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
      const recommendedIndex = sizeOrder.indexOf(recommendedSize);
      
      let closestSize = recommendedSize;
      let minDistance = Infinity;
      
      for (const size of availableSizes) {
        const sizeIndex = sizeOrder.indexOf(size);
        const distance = Math.abs(sizeIndex - recommendedIndex);
        if (distance < minDistance) {
          minDistance = distance;
          closestSize = size;
        }
      }
      
      recommendedSize = closestSize;
    }
    
    return {
      size: recommendedSize,
      confidence,
      reason,
      alternatives: alternatives.filter(alt => sizes.includes(alt)),
    };
  }

  // Get size recommendation reason
  private static getSizeReason(bodyType: string, brand: string): string {
    const reasons = {
      apple: `Based on your body type, we recommend sizing up for comfort around the waist. ${brand} tends to run true to size.`,
      pear: `Your body type works well with this size. ${brand} sizing should accommodate your proportions.`,
      hourglass: `This size will highlight your curves perfectly. ${brand} cuts are ideal for your body type.`,
      rectangle: `This size will create the illusion of curves. ${brand} styling will add definition to your silhouette.`,
    };
    
    return reasons[bodyType as keyof typeof reasons] || 'This size should work well for your body type.';
  }

  // Get body flattery advice
  static getBodyFlatteryAdvice(
    outfit: Array<{ category: string; subcategory: string; color: string }>,
    avatar: UserAvatar
  ): string {
    const { bodyType } = avatar;
    const categories = outfit.map(item => item.category.toLowerCase());
    const colors = outfit.map(item => item.color.toLowerCase());
    
    let advice = '';
    
    if (bodyType === 'pear') {
      if (categories.includes('tops') && colors.some(c => ['white', 'light blue', 'pink'].includes(c))) {
        advice = 'The light-colored top draws attention upward, balancing your proportions perfectly.';
      } else if (categories.includes('bottoms') && colors.some(c => ['black', 'navy', 'dark'].includes(c))) {
        advice = 'Dark bottoms create a slimming effect while the outfit maintains balance.';
      } else {
        advice = 'This combination creates a balanced silhouette that flatters your figure.';
      }
    } else if (bodyType === 'apple') {
      if (categories.includes('dresses') || (categories.includes('tops') && categories.includes('bottoms'))) {
        advice = 'The outfit creates a defined waistline and elongates your figure beautifully.';
      } else {
        advice = 'This look emphasizes your best features and creates a flattering silhouette.';
      }
    } else if (bodyType === 'hourglass') {
      if (categories.includes('dresses') || (categories.includes('tops') && categories.includes('bottoms'))) {
        advice = 'This outfit accentuates your natural curves and creates an elegant silhouette.';
      } else {
        advice = 'The combination highlights your hourglass figure perfectly.';
      }
    } else if (bodyType === 'rectangle') {
      if (categories.includes('dresses') || (categories.includes('tops') && categories.includes('bottoms'))) {
        advice = 'This outfit adds curves and definition to your silhouette.';
      } else {
        advice = 'The combination creates the illusion of curves and adds visual interest.';
      }
    }
    
    return advice || 'This outfit creates a flattering silhouette that enhances your natural beauty.';
  }

  // Get styling recommendations based on body type
  static getStylingRecommendations(avatar: UserAvatar): string[] {
    const { bodyType } = avatar;
    
    const recommendations = {
      pear: [
        'Emphasize your upper body with statement necklaces or earrings',
        'Choose tops with interesting details like ruffles or patterns',
        'Opt for high-waisted bottoms to elongate your legs',
        'Use belts to define your waist',
        'Avoid overly tight bottoms that emphasize your hips'
      ],
      apple: [
        'Create a defined waistline with belts or fitted pieces',
        'Choose tops that skim over your midsection',
        'Opt for A-line or empire waist dresses',
        'Use vertical lines to elongate your silhouette',
        'Avoid overly tight or boxy styles'
      ],
      hourglass: [
        'Embrace your curves with fitted silhouettes',
        'Use belts to highlight your waist',
        'Choose pieces that follow your natural shape',
        'Opt for wrap dresses and fitted tops',
        'Avoid overly loose or boxy styles that hide your figure'
      ],
      rectangle: [
        'Create curves with ruching, draping, or peplum details',
        'Use belts to define your waist',
        'Choose pieces with interesting textures or patterns',
        'Opt for A-line or fit-and-flare silhouettes',
        'Avoid overly straight or boxy cuts'
      ]
    };
    
    return recommendations[bodyType] || [];
  }
}
