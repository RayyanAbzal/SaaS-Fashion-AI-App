import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { env } from '../config/env';

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  icon: string;
  description: string;
  precipitation: number;
  uv: number;
  forecast: WeatherForecast[];
}

export interface WeatherForecast {
  date: Date;
  temperature: {
    min: number;
    max: number;
  };
  condition: string;
  icon: string;
  precipitation: number;
  humidity: number;
}

export interface OutfitRecommendation {
  conditions: string[];
  temperature: {
    min: number;
    max: number;
  };
  recommendations: {
    tops: string[];
    bottoms: string[];
    outerwear: string[];
    accessories: string[];
  };
}

export class WeatherService {
  private static readonly API_KEY = env.OPENWEATHER_API_KEY;
  private static readonly BASE_URL = 'https://api.openweathermap.org/data/2.5';

  static async getCurrentLocation(): Promise<Location.LocationObject> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }

    const location = await Location.getCurrentPositionAsync({});
    return location;
  }

  static async getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
    try {
      const apiKey = this.API_KEY;
      const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorBody = await response.text();
        console.error('WeatherAPI.com error:', response.status, errorBody);
        throw new Error('Failed to fetch weather data');
      }
      const data = await response.json();
      return {
        temperature: Math.round(data.current.temp_c),
        feelsLike: Math.round(data.current.feelslike_c),
        humidity: data.current.humidity,
        windSpeed: data.current.wind_kph,
        condition: data.current.condition.text,
        icon: `https:${data.current.condition.icon}`,
        description: data.current.condition.text,
        precipitation: data.current.precip_mm,
        uv: data.current.uv,
        forecast: [] // You can implement forecast fetching if needed
      };
    } catch (error) {
      console.error('Error fetching weather:', error);
      throw error;
    }
  }

  static async getForecast(lat: number, lon: number): Promise<WeatherForecast[]> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch forecast data');
      }

      const data = await response.json();
      const dailyForecasts: WeatherForecast[] = [];
      const dailyData: Record<string, any[]> = {};

      // Group forecast data by day
      data.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        if (!dailyData[date]) {
          dailyData[date] = [];
        }
        dailyData[date].push(item);
      });

      // Process each day's data
      Object.entries(dailyData).forEach(([date, items]) => {
        const temps = items.map(item => item.main.temp);
        const forecast: WeatherForecast = {
          date: new Date(date),
          temperature: {
            min: Math.round(Math.min(...temps)),
            max: Math.round(Math.max(...temps))
          },
          condition: items[0].weather[0].main,
          icon: `https://openweathermap.org/img/wn/${items[0].weather[0].icon}@2x.png`,
          precipitation: items.reduce((acc, item) => acc + (item.rain?.['3h'] || 0), 0),
          humidity: Math.round(items.reduce((acc, item) => acc + item.main.humidity, 0) / items.length)
        };
        dailyForecasts.push(forecast);
      });

      return dailyForecasts.slice(0, 5); // Return next 5 days
    } catch (error) {
      console.error('Error fetching forecast:', error);
      throw error;
    }
  }

  private static async getUVIndex(lat: number, lon: number): Promise<number> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/uvi?lat=${lat}&lon=${lon}&appid=${this.API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch UV data');
      }

      const data = await response.json();
      return Math.round(data.value);
    } catch (error) {
      console.error('Error fetching UV index:', error);
      return 0;
    }
  }

  static getOutfitRecommendations(weather: WeatherData): OutfitRecommendation {
    const temp = weather.temperature;
    const condition = weather.condition.toLowerCase();
    const recommendations: OutfitRecommendation = {
      conditions: [condition],
      temperature: {
        min: temp - 2,
        max: temp + 2
      },
      recommendations: {
        tops: [],
        bottoms: [],
        outerwear: [],
        accessories: []
      }
    };

    // Base layer recommendations
    if (temp < 10) {
      recommendations.recommendations.tops.push('Long-sleeve thermal', 'Turtleneck');
      recommendations.recommendations.bottoms.push('Warm pants', 'Thermal leggings');
    } else if (temp < 20) {
      recommendations.recommendations.tops.push('Long-sleeve shirt', 'Light sweater');
      recommendations.recommendations.bottoms.push('Jeans', 'Chinos');
    } else {
      recommendations.recommendations.tops.push('T-shirt', 'Short-sleeve shirt');
      recommendations.recommendations.bottoms.push('Shorts', 'Light pants');
    }

    // Outerwear recommendations
    if (temp < 5) {
      recommendations.recommendations.outerwear.push('Heavy coat', 'Puffer jacket');
    } else if (temp < 15) {
      recommendations.recommendations.outerwear.push('Light jacket', 'Cardigan');
    } else if (condition.includes('rain')) {
      recommendations.recommendations.outerwear.push('Rain jacket', 'Waterproof coat');
    }

    // Accessories based on conditions
    if (weather.uv > 5) {
      recommendations.recommendations.accessories.push('Sunglasses', 'Hat');
    }
    if (condition.includes('rain')) {
      recommendations.recommendations.accessories.push('Umbrella', 'Waterproof shoes');
    }
    if (temp < 10) {
      recommendations.recommendations.accessories.push('Scarf', 'Gloves', 'Beanie');
    }

    return recommendations;
  }
} 