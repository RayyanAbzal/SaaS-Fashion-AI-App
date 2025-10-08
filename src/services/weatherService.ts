import * as Location from 'expo-location';

export interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
}

export class WeatherService {
  // Simple weather service that works without external APIs for now
  // We can add real weather integration later
  
  static async getCurrentLocation(): Promise<Location.LocationObject> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 300000, // 5 minutes
        distanceInterval: 1000 // 1km
      });
      return location;
    } catch (error) {
      console.warn('Location service unavailable:', error);
      // Return mock location for demo purposes
      return {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          altitude: null,
          accuracy: 1000,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      } as Location.LocationObject;
    }
  }

  static async getCurrentWeather(lat?: number, lon?: number): Promise<WeatherData> {
    try {
      // For now, return mock weather data
      // This ensures the app works while we integrate real weather later
      const mockWeather: WeatherData = {
        temperature: 22, // 22°C - comfortable spring weather
        condition: 'Partly Cloudy',
        icon: 'partly-sunny'
      };

      // TODO: Integrate with real weather API when ready
      // const apiKey = 'YOUR_WEATHER_API_KEY';
      // const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}`);
      // const data = await response.json();
      
      return mockWeather;
    } catch (error) {
      console.warn('Weather service unavailable, using fallback:', error);
      // Fallback weather data
      return {
        temperature: 20,
        condition: 'Mild',
        icon: 'partly-sunny'
      };
    }
  }

  // Get weather without location (for demo/testing)
  static async getCurrentWeatherSimple(): Promise<WeatherData> {
    return this.getCurrentWeather();
  }

  // Get weather recommendations for outfit suggestions
  static getOutfitRecommendations(weather: WeatherData): string[] {
    const recommendations: string[] = [];
    
    if (weather.temperature < 10) {
      recommendations.push('Wear warm layers', 'Consider a jacket or coat', 'Boots would work well');
    } else if (weather.temperature < 20) {
      recommendations.push('Light jacket weather', 'Long sleeves recommended', 'Comfortable shoes');
    } else if (weather.temperature < 30) {
      recommendations.push('Perfect for light clothing', 'Shorts and t-shirts work', 'Breathable fabrics');
    } else {
      recommendations.push('Stay cool and comfortable', 'Light, breathable materials', 'Sun protection needed');
    }

    if (weather.condition.toLowerCase().includes('rain')) {
      recommendations.push('Waterproof shoes recommended', 'Consider an umbrella');
    }

    return recommendations;
  }
} 