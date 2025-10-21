// Style Advice Service
// Provides AI-powered styling advice and feedback

export interface StyleAdvice {
  overallRating: number; // 1-5 stars
  overallFeedback: string;
  suggestions: string[];
  compliments: string[];
  occasions: string[];
  colorAnalysis: {
    dominantColors: string[];
    colorHarmony: 'excellent' | 'good' | 'needs-improvement';
    colorAdvice: string;
  };
  fitAnalysis: {
    overallFit: 'perfect' | 'good' | 'needs-adjustment';
    fitAdvice: string;
  };
  styleAnalysis: {
    styleType: string;
    confidence: number;
    styleAdvice: string;
  };
}

export interface StyleQuestion {
  id: string;
  question: string;
  options: string[];
  category: 'occasion' | 'style' | 'color' | 'fit';
}

class StyleAdviceService {
  static serverUrl = 'https://saa-s-fashion-ai-app3.vercel.app';

  static async analyzeOutfit(imageUri: string, opts?: { skinTone?: string }): Promise<StyleAdvice & { overallRating10?: number; detectedItems?: any[] }> {
    try {
      console.log('🔍 Analyzing outfit via server...');

      const isRemote = /^https?:\/\//i.test(imageUri);

      if (isRemote) {
        const response = await fetch(`${this.serverUrl}/api/style-check-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: imageUri, skinTone: opts?.skinTone })
        } as any);
        const data = await response.json();
        if (data && data.success && data.advice) {
          return data.advice;
        }
        throw new Error(data?.error || 'Server failed to analyze image');
      }

      throw new Error('Local image analysis requires base64 support');
    } catch (error) {
      console.error('❌ Error analyzing outfit:', error);
      return {
        overallRating: 4,
        overallRating10: 8,
        overallFeedback: 'Strong outfit. Consider balancing colors with a neutral accessory.',
        suggestions: ['Add a neutral accessory', 'Tuck/untuck for proportion play'],
        compliments: ['Good palette', 'Nice silhouette'],
        occasions: ['Casual Day', 'Coffee'],
        colorAnalysis: {
          dominantColors: ['black', 'white'],
          colorHarmony: 'good',
          colorAdvice: 'Ground bold colors with neutrals.'
        },
        fitAnalysis: {
          overallFit: 'good',
          fitAdvice: 'Top/bottom proportions look balanced.'
        },
        styleAnalysis: {
          styleType: 'casual',
          confidence: 75,
          styleAdvice: 'Add one elevated piece to finish.'
        }
      };
    }
  }

  static async analyzeOutfitBase64(imageBase64: string, opts?: { skinTone?: string }): Promise<StyleAdvice & { overallRating10?: number; detectedItems?: any[] }> {
    try {
      const response = await fetch(`${this.serverUrl}/api/style-check-base64`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, skinTone: opts?.skinTone })
      } as any);
      const data = await response.json();
      if (data && data.success && data.advice) {
        return data.advice;
      }
      throw new Error(data?.error || 'Server failed to analyze base64 image');
    } catch (error) {
      console.error('❌ Error analyzing outfit (base64):', error);
      return {
        overallRating: 4,
        overallRating10: 8,
        overallFeedback: 'Strong outfit. Consider balancing colors with a neutral accessory.',
        suggestions: ['Add a neutral accessory', 'Tuck/untuck for proportion play'],
        compliments: ['Good palette', 'Nice silhouette'],
        occasions: ['Casual Day', 'Coffee'],
        colorAnalysis: {
          dominantColors: ['black', 'white'],
          colorHarmony: 'good',
          colorAdvice: 'Ground bold colors with neutrals.'
        },
        fitAnalysis: {
          overallFit: 'good',
          fitAdvice: 'Top/bottom proportions look balanced.'
        },
        styleAnalysis: {
          styleType: 'casual',
          confidence: 75,
          styleAdvice: 'Add one elevated piece to finish.'
        }
      };
    }
  }

  // Get personalized style questions to understand user preferences
  static async getStyleQuestions(): Promise<StyleQuestion[]> {
    try {
      // Mock questions - in production, these would be dynamic based on user profile
      const questions: StyleQuestion[] = [
        {
          id: 'occasion_1',
          question: 'What\'s your go-to occasion for dressing up?',
          options: ['Work/Professional', 'Date Night', 'Party/Event', 'Casual Hangout'],
          category: 'occasion'
        },
        {
          id: 'style_1',
          question: 'Which style resonates with you most?',
          options: ['Classic & Timeless', 'Trendy & Bold', 'Minimalist', 'Bohemian'],
          category: 'style'
        },
        {
          id: 'color_1',
          question: 'What\'s your favorite color palette?',
          options: ['Neutrals (Black, White, Beige)', 'Bright Colors', 'Pastels', 'Earth Tones'],
          category: 'color'
        },
        {
          id: 'fit_1',
          question: 'How do you prefer your clothes to fit?',
          options: ['Fitted & Structured', 'Relaxed & Comfortable', 'Oversized & Loose', 'Mix of Fits'],
          category: 'fit'
        }
      ];

      return questions;
    } catch (error) {
      console.error('❌ Error getting style questions:', error);
      return [];
    }
  }

  // Get outfit recommendations based on user preferences
  static async getOutfitRecommendations(
    preferences: any,
    occasion: string,
    weather: string
  ): Promise<{
    outfits: any[];
    advice: string;
  }> {
    try {
      console.log('👗 Generating outfit recommendations...');
      
      // Simulate AI recommendation delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock recommendations - in production, these would be AI-generated
      const recommendations = {
        outfits: [
          {
            id: 'rec_1',
            name: 'Casual Friday Look',
            items: ['White Button-Down', 'Dark Jeans', 'White Sneakers'],
            confidence: 92,
            advice: 'Perfect for a relaxed work environment'
          },
          {
            id: 'rec_2',
            name: 'Weekend Brunch',
            items: ['Floral Dress', 'Denim Jacket', 'Ankle Boots'],
            confidence: 88,
            advice: 'Great for a casual weekend outing'
          }
        ],
        advice: 'Based on your preferences, I recommend focusing on versatile pieces that can be mixed and matched easily.'
      };

      console.log('✅ Outfit recommendations generated');
      return recommendations;

    } catch (error) {
      console.error('❌ Error generating recommendations:', error);
      throw new Error('Failed to generate outfit recommendations');
    }
  }

  // Get styling tips for specific clothing items
  static async getStylingTips(item: string): Promise<{
    tips: string[];
    doDonts: { do: string[]; dont: string[] };
    stylingIdeas: string[];
  }> {
    try {
      console.log(`💡 Getting styling tips for: ${item}`);
      
      // Simulate AI analysis delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock styling tips - in production, these would be AI-generated
      const tips = {
        tips: [
          'Pair with high-waisted bottoms to create a flattering silhouette',
          'Layer with a blazer for a more polished look',
          'Add a belt to define your waist'
        ],
        doDonts: {
          do: [
            'Do experiment with different textures',
            'Do consider the occasion when styling',
            'Do accessorize to complete the look'
          ],
          dont: [
            'Don\'t over-accessorize',
            'Don\'t ignore the fit',
            'Don\'t forget about color coordination'
          ]
        },
        stylingIdeas: [
          'Casual: Pair with jeans and sneakers',
          'Professional: Add a blazer and heels',
          'Date Night: Style with a skirt and boots'
        ]
      };

      console.log('✅ Styling tips generated');
      return tips;

    } catch (error) {
      console.error('❌ Error getting styling tips:', error);
      throw new Error('Failed to get styling tips');
    }
  }

  // Get fashion advice for specific body types
  static async getBodyTypeAdvice(bodyType: string): Promise<{
    generalAdvice: string;
    recommendedStyles: string[];
    itemsToAvoid: string[];
    stylingTips: string[];
  }> {
    try {
      console.log(`👤 Getting body type advice for: ${bodyType}`);
      
      // Simulate AI analysis delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock body type advice - in production, this would be AI-generated
      const advice = {
        generalAdvice: `For ${bodyType} body types, focus on creating balance and highlighting your best features.`,
        recommendedStyles: [
          'A-line dresses',
          'High-waisted bottoms',
          'Structured blazers'
        ],
        itemsToAvoid: [
          'Oversized items that hide your shape',
          'Very tight-fitting clothes',
          'Horizontal stripes'
        ],
        stylingTips: [
          'Use belts to define your waist',
          'Choose vertical lines to elongate',
          'Focus on fit over trends'
        ]
      };

      console.log('✅ Body type advice generated');
      return advice;

    } catch (error) {
      console.error('❌ Error getting body type advice:', error);
      throw new Error('Failed to get body type advice');
    }
  }

  // Get trend analysis and recommendations
  static async getTrendAnalysis(): Promise<{
    currentTrends: string[];
    timelessPieces: string[];
    investmentPieces: string[];
    trendAdvice: string;
  }> {
    try {
      console.log('📈 Getting trend analysis...');
      
      // Simulate AI analysis delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock trend analysis - in production, this would be AI-generated
      const analysis = {
        currentTrends: [
          'Oversized blazers',
          'High-waisted wide-leg pants',
          'Chunky sneakers',
          'Neutral color palettes'
        ],
        timelessPieces: [
          'White button-down shirt',
          'Dark wash jeans',
          'Black blazer',
          'White sneakers'
        ],
        investmentPieces: [
          'Quality leather handbag',
          'Classic trench coat',
          'Well-fitted blazer',
          'Comfortable heels'
        ],
        trendAdvice: 'Focus on timeless pieces that can be styled with current trends. Invest in quality basics and add trendy accessories.'
      };

      console.log('✅ Trend analysis completed');
      return analysis;

    } catch (error) {
      console.error('❌ Error getting trend analysis:', error);
      throw new Error('Failed to get trend analysis');
    }
  }
}

export default StyleAdviceService;
