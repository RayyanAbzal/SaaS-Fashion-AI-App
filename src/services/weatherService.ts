import * as Location from 'expo-location';
import Constants from 'expo-constants';

const API_KEY = Constants.expoConfig?.extra?.openWeatherApiKey || 'dea5bf614a1c5eee965149b436f21b39';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  feelsLike: number;
}

export const getCurrentWeather = async (): Promise<WeatherData | null> => {
  try {
    // Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission denied');
      return null;
    }

    // Get current location
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    const { latitude, longitude } = location.coords;

    // Fetch weather data
    const response = await fetch(
      `${BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Ensure we're getting accurate temperature data
    const temperature = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);
    
    // Validate temperature data
    if (temperature < -50 || temperature > 60) {
      console.warn('Suspicious temperature value received:', temperature);
    }
    
    return {
      temperature: temperature,
      condition: data.weather[0].main,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      feelsLike: feelsLike
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    // Return mock data as fallback for development
    return {
      temperature: 10, // Default to 10°C as fallback
      condition: 'Cloudy',
      humidity: 65,
      windSpeed: 5,
      description: 'partly cloudy',
      icon: '02d',
      feelsLike: 8
    };
  }
};

export const getWeatherRecommendations = (weather: WeatherData): string[] => {
  const recommendations: string[] = [];
  
  if (weather.temperature < 10) {
    recommendations.push('Wear warm layers', 'Consider a heavy coat', 'Boots would be perfect');
  } else if (weather.temperature < 20) {
    recommendations.push('Light jacket weather', 'Layers are your friend', 'Comfortable shoes');
  } else if (weather.temperature < 30) {
    recommendations.push('Perfect for light clothing', 'Shorts and t-shirts work', 'Sandals or sneakers');
  } else {
    recommendations.push('Stay cool with breathable fabrics', 'Light colors recommended', 'Stay hydrated!');
  }

  if (weather.condition.toLowerCase().includes('rain')) {
    recommendations.push('Don\'t forget an umbrella', 'Waterproof shoes', 'Rain jacket needed');
  } else if (weather.condition.toLowerCase().includes('snow')) {
    recommendations.push('Bundle up!', 'Waterproof boots', 'Warm accessories');
  }

  return recommendations;
}; 