// Chatbot Stylist Service
// Implements conversational AI for outfit recommendations and style advice
// Aligned with PDF: "Conversational Chatbot Stylist" requirement

import Constants from 'expo-constants';
import { WardrobeItem, OutfitCombination } from '@/types';
import { WeatherData } from './weatherService';
import { getOpenAIChatCompletion } from './openaiService';

// ChatContext interface aligned with PDF requirements
export interface ChatContext {
  currentWeather?: {
    temperature: number;
    condition: string;
    feelsLike: number;
    season?: string;
  };
  wardrobe?: WardrobeItem[];
  userSchedule?: Array<{
    title: string;
    startTime: string;
    type: string;
  }>;
  recentOutfits?: Array<{
    id: string;
    name: string;
    items: any[];
  }>;
  userPreferences?: {
    style?: string;
    colors?: string[];
    brands?: string[];
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    outfitId?: string;
    recommendationType?: 'outfit' | 'perfume' | 'advice';
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  context: ChatContext;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatbotResponse {
  message: string;
  suggestions?: string[];
  outfitRecommendation?: OutfitCombination;
  explanation?: string;
  followUpQuestions?: string[];
}

class ChatbotService {
  private static readonly MODEL = 'gpt-4-turbo-preview'; // Use GPT-4 for better reasoning
  private static readonly MAX_TOKENS = 500; // Keep responses concise
  private static readonly TEMPERATURE = 0.8; // Creative but focused

  /**
   * Generate a conversational response from the chatbot
   * Aligned with PDF: "Chatbot Stylist that explains recommendations"
   */
  static async generateResponse(
    userMessage: string,
    context: ChatContext,
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatbotResponse> {
    try {
      // Build system prompt with context
      const systemPrompt = this.buildSystemPrompt(context);

      // Build conversation messages
      const messages = this.buildConversationMessages(
        systemPrompt,
        userMessage,
        conversationHistory
      );

      // Get AI response
      const aiResponse = await getOpenAIChatCompletion(messages, this.MODEL);

      // Parse response for structured data
      const parsedResponse = this.parseResponse(aiResponse, context);

      return parsedResponse;
    } catch (error) {
      console.error('Chatbot error:', error);
      return this.getFallbackResponse(userMessage, context);
    }
  }

  /**
   * Build system prompt with full context
   * Aligned with PDF: Context-aware recommendations
   */
  private static buildSystemPrompt(context: ChatContext): string {
    let prompt = `You are StyleMate, a Gen Z fashion assistant and personal stylist. You're supportive, trendy, and help users make confident style decisions.

**Your Personality:**
- Supportive and encouraging
- Understands Gen Z culture and trends
- Uses emojis naturally (not excessively)
- Gives actionable, specific advice
- Explains WHY recommendations work
- Keeps responses under 100 words

**Your Capabilities:**
- Recommend outfits based on context (weather, occasion, mood)
- Explain color harmony, fit, and style principles
- Suggest outfit refinements ("make it more streetwear", "add a pop of color")
- Answer style questions
- Provide perfume recommendations
- Help with wardrobe organization

**Current Context:**`;

    // Add weather context
    if (context.currentWeather) {
      const weather = context.currentWeather;
      prompt += `\n- Weather: ${weather.temperature}°C, ${weather.condition} (feels like ${weather.feelsLike}°C)`;
      prompt += `\n- Season: ${weather.season || 'current'}`;
    }

    // Add wardrobe context
    if (context.wardrobe && context.wardrobe.length > 0) {
      const categories = context.wardrobe.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      prompt += `\n- Available wardrobe: ${Object.entries(categories)
        .map(([cat, count]) => `${count} ${cat}`)
        .join(', ')}`;

      // Add sample items for context
      const sampleItems = context.wardrobe
        .slice(0, 5)
        .map(item => `${item.name} (${item.color || 'various'})`)
        .join(', ');
      if (sampleItems) {
        prompt += `\n- Sample items: ${sampleItems}`;
      }
    }

    // Add schedule context
    if (context.userSchedule && context.userSchedule.length > 0) {
      const todayEvents = context.userSchedule.filter(event => {
        const eventDate = new Date(event.startTime);
        const today = new Date();
        return eventDate.toDateString() === today.toDateString();
      });

      if (todayEvents.length > 0) {
        prompt += `\n- Today's events: ${todayEvents
          .map(e => `${e.title} (${e.type})`)
          .join(', ')}`;
      }
    }

    // Add recent outfits context
    if (context.recentOutfits && context.recentOutfits.length > 0) {
      prompt += `\n- Recently worn: ${context.recentOutfits
        .slice(0, 3)
        .map(o => o.name || 'outfit')
        .join(', ')}`;
    }

    // Add user preferences
    if (context.userPreferences) {
      const prefs = context.userPreferences;
      if (prefs.style) prompt += `\n- Style preference: ${prefs.style}`;
      if (prefs.colors && prefs.colors.length > 0) {
        prompt += `\n- Favorite colors: ${prefs.colors.join(', ')}`;
      }
      if (prefs.brands && prefs.brands.length > 0) {
        prompt += `\n- Preferred brands: ${prefs.brands.join(', ')}`;
      }
    }

    prompt += `\n\n**Response Guidelines:**
- Be conversational and friendly
- Explain your reasoning ("This works because...")
- Offer specific suggestions
- Ask follow-up questions if helpful
- If user asks to refine an outfit, provide specific changes
- Keep responses concise (under 100 words)`;

    return prompt;
  }

  /**
   * Build conversation message array for OpenAI API
   */
  private static buildConversationMessages(
    systemPrompt: string,
    userMessage: string,
    history: ChatMessage[]
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history (last 10 messages for context)
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      if (msg.role !== 'system') {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: userMessage });

    return messages;
  }

  /**
   * Parse AI response to extract structured data
   */
  private static parseResponse(
    aiResponse: string,
    context: ChatContext
  ): ChatbotResponse {
    // Extract suggestions (lines starting with bullet points or dashes)
    const suggestions = aiResponse
      .split('\n')
      .filter(line => /^[-•*]\s/.test(line.trim()))
      .map(line => line.replace(/^[-•*]\s/, '').trim())
      .slice(0, 3);

    // Extract follow-up questions (lines ending with "?")
    const followUpQuestions = aiResponse
      .split('\n')
      .filter(line => line.trim().endsWith('?'))
      .map(line => line.trim())
      .slice(0, 2);

    // Check if response mentions outfit refinement
    const isRefinementRequest =
      /(make|change|adjust|refine|modify|tweak|update)/i.test(aiResponse) &&
      /(outfit|look|style|ensemble)/i.test(aiResponse);

    return {
      message: aiResponse.trim(),
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      followUpQuestions:
        followUpQuestions.length > 0 ? followUpQuestions : undefined,
      explanation: this.extractExplanation(aiResponse),
    };
  }

  /**
   * Extract explanation from response (sentences with "because", "since", "as")
   */
  private static extractExplanation(response: string): string | undefined {
    const explanationPattern = /(?:because|since|as|why|reason)[^.!?]*(?:[.!?]|$)/gi;
    const matches = response.match(explanationPattern);
    return matches && matches.length > 0 ? matches[0].trim() : undefined;
  }

  /**
   * Fallback response if AI fails
   */
  private static getFallbackResponse(
    userMessage: string,
    context: ChatContext
  ): ChatbotResponse {
    const lowerMessage = userMessage.toLowerCase();

    // Detect intent
    if (/(outfit|wear|dress|clothes|style)/i.test(userMessage)) {
      return {
        message:
          "I'd love to help you with outfit suggestions! Based on your wardrobe and the current weather, I can recommend some great combinations. Would you like me to generate some outfit options?",
        followUpQuestions: [
          'What occasion are you dressing for?',
          'Any specific style you want to try?',
        ],
      };
    }

    if (/(perfume|scent|fragrance)/i.test(userMessage)) {
      return {
        message:
          "I can help you choose the perfect perfume! I'll consider the weather, occasion, and your style preferences. Would you like a recommendation?",
      };
    }

    if (/(color|palette|match)/i.test(userMessage)) {
      return {
        message:
          'Color coordination is key! I can help you create harmonious color combinations. What colors are you working with?',
      };
    }

    // Generic fallback
    return {
      message:
        "I'm here to help with all your style questions! Whether it's outfit recommendations, color advice, or style tips, I've got you covered. What would you like to know?",
      followUpQuestions: [
        'Need outfit suggestions?',
        'Want perfume recommendations?',
        'Have a style question?',
      ],
    };
  }

  /**
   * Generate outfit refinement suggestions
   * Aligned with PDF: "User can say 'make it more streetwear'"
   */
  static async refineOutfit(
    outfit: OutfitCombination,
    userRequest: string,
    context: ChatContext
  ): Promise<ChatbotResponse> {
    const refinementPrompt = `The user wants to refine this outfit: "${outfit.summary}"

User's request: "${userRequest}"

Outfit details:
${outfit.items.map(item => `- ${item.name} (${item.color || 'various'})`).join('\n')}

Provide specific, actionable suggestions to refine this outfit according to the user's request. Be specific about what to change, add, or remove.`;

    const messages = [
      {
        role: 'system' as const,
        content: this.buildSystemPrompt(context),
      },
      {
        role: 'user' as const,
        content: refinementPrompt,
      },
    ];

    try {
      const aiResponse = await getOpenAIChatCompletion(messages, this.MODEL);
      return {
        message: aiResponse.trim(),
        explanation: this.extractExplanation(aiResponse),
      };
    } catch (error) {
      console.error('Outfit refinement error:', error);
      return {
        message:
          "I'd suggest trying different pieces or adding accessories to achieve that look. Would you like me to generate a new outfit variation?",
      };
    }
  }

  /**
   * Explain why an outfit was recommended
   * Aligned with PDF: "Explainability" requirement
   */
  static async explainRecommendation(
    outfit: OutfitCombination,
    context: ChatContext
  ): Promise<string> {
    const explanationPrompt = `Explain why this outfit was recommended:

Outfit: "${outfit.summary}"
Items: ${outfit.items.map(item => item.name).join(', ')}
Confidence: ${outfit.confidence || 85}%
Occasion: ${outfit.occasion || 'casual'}
Weather: ${context.currentWeather?.temperature || 'N/A'}°C

Provide a clear, concise explanation (2-3 sentences) of why this outfit works well for the user's context.`;

    const messages = [
      {
        role: 'system' as const,
        content: this.buildSystemPrompt(context),
      },
      {
        role: 'user' as const,
        content: explanationPrompt,
      },
    ];

    try {
      const explanation = await getOpenAIChatCompletion(messages, this.MODEL);
      return explanation.trim();
      } catch (error) {
      console.error('Explanation error:', error);
      return `This outfit works well for ${outfit.occasion || 'casual'} occasions and the current weather. The combination balances style and comfort.`;
    }
  }

  /**
   * Generate quick style tips based on context
   */
  static async getStyleTips(context: ChatContext): Promise<string[]> {
    const tipsPrompt = `Provide 3 quick style tips for today based on:
- Weather: ${context.currentWeather?.temperature || 'N/A'}°C, ${context.currentWeather?.condition || 'N/A'}
- Available wardrobe: ${context.wardrobe?.length || 0} items
- Style preference: ${context.userPreferences?.style || 'casual'}

Return only 3 concise tips (one per line, no bullets).`;

    const messages = [
      {
        role: 'system' as const,
        content: this.buildSystemPrompt(context),
      },
      {
        role: 'user' as const,
        content: tipsPrompt,
      },
    ];

    try {
      const response = await getOpenAIChatCompletion(messages, this.MODEL);
      return response
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^[-•*0-9.]+\s*/, '').trim())
        .slice(0, 3);
    } catch (error) {
      console.error('Style tips error:', error);
      return [
        'Layer pieces for versatility',
        'Choose colors that complement your skin tone',
        'Accessorize to complete the look',
      ];
    }
  }
}

export default ChatbotService;

