import { OutfitSuggestion, WardrobeItem, User, Category } from '../types';
import { FirestoreService } from './firestoreService';
import { StyleService } from './styleService';
import { WeatherService } from './weatherService';

interface ChatResponse {
  text: string;
  outfitSuggestions?: OutfitSuggestion[];
  wardrobeItems?: WardrobeItem[];
  quickReplies?: { title: string; payload: string }[];
}

export class ChatbotService {
  private static async getUser(userId: string): Promise<User | null> {
    // This could be enhanced with caching
    return FirestoreService.getUser(userId);
  }

  public static async processMessage(
    message: string,
    userId: string
  ): Promise<ChatResponse> {
    const user = await this.getUser(userId);
    if (!user) {
      return { text: "Sorry, I can't seem to find your profile. Please try logging in again." };
    }

    const lowerCaseMessage = message.toLowerCase();

    // Pattern 1: "What should I wear?" -> Generate outfit suggestions
    if (lowerCaseMessage.includes('what should i wear') || lowerCaseMessage.includes('give me an outfit')) {
      return this.handleOutfitRequest(userId);
    }

    // Pattern 2: Weather-based queries
    if (lowerCaseMessage.includes('cold') || lowerCaseMessage.includes('hot') || lowerCaseMessage.includes('rain')) {
      return this.handleWeatherQuery(userId, lowerCaseMessage);
    }
    
    // Pattern 3: Occasion-based queries
    if (lowerCaseMessage.includes('date') || lowerCaseMessage.includes('work') || lowerCaseMessage.includes('party')) {
        return this.handleOccasionQuery(userId, lowerCaseMessage);
    }

    // Pattern 4: "Show me my dresses" -> Display wardrobe category
    const categoryMatch = lowerCaseMessage.match(/show me my (tops|bottoms|shoes|accessories|outerwear|dresses|shirts|jeans)/);
    if (categoryMatch && categoryMatch[1]) {
        let category = categoryMatch[1] as Category | 'dresses' | 'shirts' | 'jeans';
        
        // Normalize category
        const categoryMap = {
            'dresses': 'tops',
            'shirts': 'tops',
            'jeans': 'bottoms'
        };
        
        const finalCategory = categoryMap[category as keyof typeof categoryMap] || category;
        
        return this.handleCategoryQuery(userId, finalCategory as Category);
    }

    // Default response
    return {
      text: "I'm here to help with your style! You can ask me 'What should I wear?', talk about the weather, or ask me to show you items from your wardrobe.",
      quickReplies: [
          { title: "What should I wear?", payload: "what should i wear" },
          { title: "It's cold today", payload: "it's cold today" },
          { title: "Show me my tops", payload: "show me my tops" },
      ]
    };
  }

  private static async handleOutfitRequest(userId: string): Promise<ChatResponse> {
    try {
      const suggestions = await StyleService.getOutfitSuggestions(userId);
      if (suggestions.length === 0) {
        return { text: "I couldn't come up with any outfits right now. Maybe add some more items to your wardrobe?" };
      }
      return {
        text: "Here are a few outfit ideas I put together for you!",
        outfitSuggestions: suggestions,
      };
    } catch (error) {
      console.error(error);
      return { text: "I'm having a little trouble thinking of outfits right now. Please try again in a moment." };
    }
  }

  private static async handleWeatherQuery(userId: string, message: string): Promise<ChatResponse> {
      try {
        const location = await WeatherService.getCurrentLocation();
        const weather = await WeatherService.getCurrentWeather(location.coords.latitude, location.coords.longitude);
        if (!weather) {
            return { text: "I couldn't get the current weather. Can you try again in a bit?" };
        }
        
        let responseText = `The weather is ${weather.temperature}\u00b0C and ${weather.condition}. `;
        
        if (message.includes('cold') || weather.temperature < 10) {
            responseText += "Definitely time to bundle up! Think warm layers, knits, and a good coat.";
        } else if (message.includes('hot') || weather.temperature > 22) {
            responseText += "It's warm out! Time for light fabrics like cotton or linen.";
        } else {
            responseText += "It's pretty mild. A great day for a light jacket or just a sweater.";
        }
        
        // Future enhancement: call StyleService with weather context.
        return { text: responseText };
      } catch (error) {
        console.error(error);
        return { text: "I couldn't get the current weather. Can you try again in a bit?" };
      }
  }
  
  private static async handleOccasionQuery(userId: string, message: string): Promise<ChatResponse> {
      let occasion = 'casual';
      if(message.includes('date')) occasion = 'date';
      if(message.includes('work')) occasion = 'work';
      if(message.includes('party')) occasion = 'party';
      
      // Future enhancement: pass occasion to StyleService.
      const responseText = `For a ${occasion}, you'll want something special! Let me see...`;
      
      // For now, we'll just return a generic outfit request.
      return this.handleOutfitRequest(userId);
  }

  private static async handleCategoryQuery(userId: string, category: Category): Promise<ChatResponse> {
    const wardrobe = await FirestoreService.getWardrobeItems(userId);
    const items = wardrobe.filter(item => item.category === category);

    if (items.length === 0) {
        return { text: `I couldn't find any ${category} in your wardrobe. Maybe add some?` };
    }

    return {
        text: `Here are all the ${category} in your wardrobe:`,
        wardrobeItems: items,
    };
  }
} 