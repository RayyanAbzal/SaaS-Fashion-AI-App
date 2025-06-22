import Constants from 'expo-constants';
import { ChatContext, WardrobeItem } from '@/types';
import { WeatherData } from './weatherService';

const OPENAI_API_KEY = Constants?.expoConfig?.extra?.openaiApiKey || process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function getOpenAIChatCompletion(messages: { role: 'system' | 'user' | 'assistant', content: string }[], model: string = 'gpt-3.5-turbo') {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is missing.');
  }
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.8,
      max_tokens: 256,
    }),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }
  const data = await response.json();
  return data.choices[0]?.message?.content?.trim() || '';
}

export function createContextualSystemPrompt(context: ChatContext): string {
  const { currentWeather, wardrobe, userSchedule, recentOutfits, userPreferences } = context;
  
  let prompt = `You are StyleMate, a Gen Z fashion assistant for college students. You're supportive, trendy, and help with quick outfit decisions. Keep responses conversational and under 100 words.

Personality: Supportive, trendy, understands Gen Z culture, uses emojis naturally, gives quick actionable advice.

Current Context:`;

  // Add weather context
  if (currentWeather) {
    prompt += `\n- Weather: ${currentWeather.temperature}°C, ${currentWeather.condition} (feels like ${currentWeather.feelsLike}°C)
- Weather recommendations: ${getWeatherRecommendations(currentWeather)}`;
  }

  // Add wardrobe context
  if (wardrobe && wardrobe.length > 0) {
    const categories = wardrobe.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    prompt += `\n- Available items: ${Object.entries(categories).map(([cat, count]) => `${count} ${cat}`).join(', ')}`;
    
    // Add some specific items for context
    const sampleItems = wardrobe.slice(0, 5).map(item => `${item.name} (${item.color})`);
    prompt += `\n- Sample items: ${sampleItems.join(', ')}`;
  }

  // Add schedule context
  if (userSchedule && userSchedule.length > 0) {
    const todayEvents = userSchedule.filter(event => {
      const eventDate = new Date(event.startTime);
      const today = new Date();
      return eventDate.toDateString() === today.toDateString();
    });
    
    if (todayEvents.length > 0) {
      prompt += `\n- Today's events: ${todayEvents.map(event => `${event.title} (${event.type})`).join(', ')}`;
    }
  }

  // Add recent outfits context
  if (recentOutfits && recentOutfits.length > 0) {
    prompt += `\n- Recently worn: ${recentOutfits.slice(0, 3).map(outfit => outfit.name).join(', ')}`;
  }

  // Add user preferences
  if (userPreferences) {
    prompt += `\n- Style preferences: ${userPreferences.stylePreferences.join(', ')}
- Favorite colors: ${userPreferences.favoriteColors.join(', ')}
- Confidence level: ${userPreferences.confidenceLevel}`;
  }

  prompt += `\n\nGuidelines:
- Use available wardrobe items when suggesting outfits
- Consider weather conditions for appropriate clothing
- Factor in schedule events and occasions
- Avoid suggesting recently worn outfits unless specifically requested
- Be encouraging and supportive
- Give quick, actionable advice
- Use emojis naturally but not excessively
- Consider user's style preferences and confidence level`;

  return prompt;
}

function getWeatherRecommendations(weather: WeatherData): string {
  if (weather.temperature < 10) {
    return 'Bundle up with warm layers, heavy coat, and boots';
  } else if (weather.temperature < 20) {
    return 'Light jacket weather, layers are your friend';
  } else if (weather.temperature < 30) {
    return 'Perfect for light clothing, shorts and t-shirts work';
  } else {
    return 'Stay cool with breathable fabrics, light colors recommended';
  }
}

export async function generateOutfitSuggestionWithContext(
  userMessage: string, 
  context: ChatContext
): Promise<string> {
  const systemPrompt = createContextualSystemPrompt(context);
  
  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userMessage }
  ];
  
  return await getOpenAIChatCompletion(messages);
} 