import * as Location from 'expo-location';

export interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
}

export class WeatherService {
  /**
   * Get current location with high accuracy for weather data
   * Uses high accuracy mode to ensure precise weather data
   */
  static async getCurrentLocation(): Promise<Location.LocationObject> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      // Use high accuracy for better weather precision
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High, // Changed from Balanced to High for better accuracy
        maximumAge: 60000, // Accept location up to 1 minute old
        timeout: 10000, // 10 second timeout
      });
      
      console.log(`📍 Location obtained: ${location.coords.latitude}, ${location.coords.longitude} (accuracy: ${location.coords.accuracy}m)`);
      return location;
    } catch (error) {
      console.warn('Location service unavailable:', error);
      // Return mock location for demo purposes (NYC)
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

  /**
   * Get real-time weather data with automatic location detection
   * This is the recommended method for getting current weather
   */
  static async getRealTimeWeather(forceRefresh: boolean = true): Promise<WeatherData> {
    try {
      const location = await this.getCurrentLocation();
      return await this.getCurrentWeather(
        location.coords.latitude,
        location.coords.longitude,
        forceRefresh
      );
    } catch (error) {
      console.error('Error getting real-time weather:', error);
      // Return fallback weather
      return {
        temperature: 22,
        condition: 'Partly Cloudy',
        icon: 'partly-sunny'
      };
    }
  }

  /**
   * Get current weather data from OpenWeatherMap API
   * Uses real-time API calls with proper error handling
   * 
   * @param lat - Latitude (optional, will use location if not provided)
   * @param lon - Longitude (optional, will use location if not provided)
   * @param forceRefresh - Force fresh API call, bypassing cache
   * @returns WeatherData with temperature, condition, and icon
   */
  static async getCurrentWeather(lat?: number, lon?: number, forceRefresh: boolean = false): Promise<WeatherData> {
    // If no coordinates provided, get location first
    if (!lat || !lon) {
      try {
        const location = await this.getCurrentLocation();
        lat = location.coords.latitude;
        lon = location.coords.longitude;
      } catch (error) {
        console.warn('Could not get location, using fallback weather');
        return {
          temperature: 22,
          condition: 'Partly Cloudy',
          icon: 'partly-sunny'
        };
      }
    }

    // Check cache first (weather doesn't change frequently) - but only if not forcing refresh
    if (!forceRefresh) {
      try {
        const { cache, cacheKeys } = await import('./mobileCache');
        const cacheKey = cacheKeys.weatherData(lat!, lon!);
        const cached = await cache.get(cacheKey);
        
        if (cached) {
          // Return cached data but log it for debugging
          console.log(`🌤️ Using cached weather: ${cached.temperature}°C (cache expires in 5 min)`);
          return cached;
        }
      } catch (error) {
        console.warn('Cache check failed, continuing:', error);
      }
    }

    // Get API key
    const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ OpenWeatherMap API key not found. Please set EXPO_PUBLIC_OPENWEATHER_API_KEY in your .env file');
      return {
        temperature: 22,
        condition: 'Partly Cloudy',
        icon: 'partly-sunny'
      };
    }

    // Use circuit breaker for weather API with retry logic
    try {
      const { withCircuitBreaker } = await import('./circuitBreaker');
      
      return await withCircuitBreaker(
        'weather',
        async () => {
          console.log(`🌤️ Fetching REAL-TIME weather from OpenWeatherMap API for lat: ${lat}, lon: ${lon}`);
          
          // Add timestamp to prevent any caching
          const timestamp = Date.now();
          const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}&_t=${timestamp}`;
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
            // Ensure no caching
            cache: 'no-store',
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Weather API error: ${response.status} ${response.statusText} - ${errorText}`);
          }
          
          const data = await response.json();
          
          // Validate response data
          if (!data.main || typeof data.main.temp !== 'number') {
            throw new Error('Invalid weather data received from API');
          }
          
          const weatherData: WeatherData = {
            temperature: Math.round(data.main.temp),
            condition: data.weather?.[0]?.main || 'Clear',
            icon: data.weather?.[0]?.icon || '01d'
          };
          
          console.log(`✅ REAL-TIME weather data received: ${weatherData.temperature}°C, ${weatherData.condition} (from OpenWeatherMap API)`);
          
          // Cache for 5 minutes (300 seconds) - reduced from 10 minutes for more accuracy
          try {
            const { cache, cacheKeys } = await import('./mobileCache');
            await cache.set(cacheKeys.weatherData(lat!, lon!), weatherData, 300);
          } catch (error) {
            console.warn('Cache set failed (non-critical):', error);
          }
          
          return weatherData;
        },
          async () => {
            // Fallback if circuit breaker is open - try to estimate from location
            if (lat && lon) {
              const estimatedTemp = this.estimateTemperatureFromLocation(lat, lon);
              console.warn(`⚠️ Weather API circuit breaker open, using location estimate: ${estimatedTemp}°C`);
              return {
                temperature: estimatedTemp,
                condition: 'Unknown',
                icon: 'partly-sunny'
              };
            }
            console.warn('⚠️ Weather API circuit breaker open, using default 20°C');
            return {
              temperature: 20,
              condition: 'Unknown',
              icon: 'partly-sunny'
            };
          },
        {
          failureThreshold: 5,
          timeout: 10000, // 10 second timeout for better reliability
          resetTimeout: 60000,
        }
      );
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Try direct API call if circuit breaker fails
      try {
        const timestamp = Date.now();
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}&_t=${timestamp}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          },
          cache: 'no-store',
        });
        
        if (response.ok) {
          const data = await response.json();
          const weatherData: WeatherData = {
            temperature: Math.round(data.main.temp),
            condition: data.weather?.[0]?.main || 'Clear',
            icon: data.weather?.[0]?.icon || '01d'
          };
          console.log(`✅ Direct API call successful: ${weatherData.temperature}°C`);
          return weatherData;
        }
      } catch (directError) {
        console.error('Direct API call also failed:', directError);
      }
    }
    
    // Final fallback - only if API key is missing or all attempts failed
    // Try to get location-based estimate if we have coordinates
    if (lat && lon) {
      // Estimate temperature based on location (rough approximation)
      // This is better than a fixed 22°C
      const estimatedTemp = this.estimateTemperatureFromLocation(lat, lon);
      console.warn(`⚠️ Weather API unavailable, using location-based estimate: ${estimatedTemp}°C`);
      return {
        temperature: estimatedTemp,
        condition: 'Unknown',
        icon: 'partly-sunny'
      };
    }
    
    console.warn('⚠️ Weather API not available and no location, using default 20°C');
    return {
      temperature: 20, // Changed from 22 to 20 as a more neutral default
      condition: 'Unknown',
      icon: 'partly-sunny'
    };
  }

  // Get weather without location (for demo/testing)
  static async getCurrentWeatherSimple(): Promise<WeatherData> {
    return this.getCurrentWeather();
  }

  // Estimate temperature from location (rough approximation based on latitude)
  private static estimateTemperatureFromLocation(lat: number, lon: number): number {
    // Rough temperature estimation based on latitude and current month
    const month = new Date().getMonth(); // 0-11
    const isSouthernHemisphere = lat < 0;
    const absLat = Math.abs(lat);
    
    // Base temperature varies by latitude
    let baseTemp = 25 - (absLat * 0.5); // Rough approximation
    
    // Adjust for season (southern hemisphere seasons are opposite)
    if (isSouthernHemisphere) {
      // Southern hemisphere: Dec-Feb is summer, Jun-Aug is winter
      if (month >= 11 || month <= 1) baseTemp += 5; // Summer
      else if (month >= 5 && month <= 7) baseTemp -= 5; // Winter
    } else {
      // Northern hemisphere: Jun-Aug is summer, Dec-Feb is winter
      if (month >= 5 && month <= 7) baseTemp += 5; // Summer
      else if (month >= 11 || month <= 1) baseTemp -= 5; // Winter
    }
    
    // Clamp to reasonable range
    return Math.round(Math.max(5, Math.min(35, baseTemp)));
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