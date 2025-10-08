// Country Road Service
// Integrates with scraped Country Road data from server

export interface CountryRoadItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  subcategory: string;
  color: string;
  size: string;
  brand: string;
  material: string;
  description: string;
  url: string;
  inStock: boolean;
  seasonality: string[];
  formality: 'casual' | 'smart-casual' | 'business' | 'formal';
  weatherSuitability: {
    minTemp: number;
    maxTemp: number;
    conditions: string[];
  };
}

class CountryRoadService {
  // Update this URL to your Vercel deployment URL
  private static baseUrl = 'https://your-app-name.vercel.app/api';
  private static cachedItems: CountryRoadItem[] = [];
  private static lastFetch: number = 0;
  private static cacheExpiry = 30 * 60 * 1000; // 30 minutes

  // Get all Country Road items
  static async getItems(): Promise<CountryRoadItem[]> {
    try {
      // Check cache first
      if (this.cachedItems.length > 0 && Date.now() - this.lastFetch < this.cacheExpiry) {
        console.log('Using cached Country Road items');
        return this.cachedItems;
      }

      console.log('Fetching Country Road items from server...');
      const response = await fetch(`${this.baseUrl}/country-road-items`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.cachedItems = data.items || [];
      this.lastFetch = Date.now();
      
      console.log(`Fetched ${this.cachedItems.length} Country Road items`);
      return this.cachedItems;

    } catch (error) {
      console.error('Error fetching Country Road items:', error);
      console.log('Server may not be running. Using fallback items.');
      // Return fallback items if server is unavailable
      return this.getFallbackItems();
    }
  }

  // Get items by category
  static async getItemsByCategory(category: string): Promise<CountryRoadItem[]> {
    const items = await this.getItems();
    return items.filter(item => 
      item.category.toLowerCase().includes(category.toLowerCase()) ||
      item.subcategory.toLowerCase().includes(category.toLowerCase())
    );
  }

  // Get items by color
  static async getItemsByColor(color: string): Promise<CountryRoadItem[]> {
    const items = await this.getItems();
    return items.filter(item => 
      item.color.toLowerCase().includes(color.toLowerCase())
    );
  }

  // Get items suitable for weather
  static async getItemsForWeather(temperature: number, condition: string): Promise<CountryRoadItem[]> {
    const items = await this.getItems();
    return items.filter(item => 
      temperature >= item.weatherSuitability.minTemp &&
      temperature <= item.weatherSuitability.maxTemp &&
      item.weatherSuitability.conditions.includes(condition)
    );
  }

  // Get items for occasion
  static async getItemsForOccasion(occasion: string): Promise<CountryRoadItem[]> {
    const items = await this.getItems();
    return items.filter(item => {
      const formality = item.formality;
      switch (occasion.toLowerCase()) {
        case 'work':
        case 'business':
          return formality === 'business' || formality === 'formal';
        case 'casual':
          return formality === 'casual' || formality === 'smart-casual';
        case 'date':
        case 'party':
          return formality === 'smart-casual' || formality === 'business';
        case 'formal':
          return formality === 'formal';
        default:
          return true;
      }
    });
  }

  // Search items by query
  static async searchItems(query: string): Promise<CountryRoadItem[]> {
    const items = await this.getItems();
    const searchTerm = query.toLowerCase();
    
    return items.filter(item => 
      item.name.toLowerCase().includes(searchTerm) ||
      item.description.toLowerCase().includes(searchTerm) ||
      item.category.toLowerCase().includes(searchTerm) ||
      item.subcategory.toLowerCase().includes(searchTerm) ||
      item.color.toLowerCase().includes(searchTerm)
    );
  }

  // Get outfit recommendations based on wardrobe items
  static async getOutfitRecommendations(
    wardrobeItems: any[],
    occasion: string,
    weather: { temperature: number; condition: string }
  ): Promise<CountryRoadItem[]> {
    try {
      const suitableItems = await this.getItemsForWeather(weather.temperature, weather.condition);
      const occasionItems = await this.getItemsForOccasion(occasion);
      
      // Find items that complement existing wardrobe
      const recommendations = suitableItems.filter(item => {
        // Check if item complements existing wardrobe colors
        const wardrobeColors = wardrobeItems.map(w => w.color.toLowerCase());
        const itemColor = item.color.toLowerCase();
        
        // Basic color complement logic
        const complementaryColors = {
          'white': ['navy', 'black', 'camel', 'grey'],
          'black': ['white', 'camel', 'grey', 'navy'],
          'navy': ['white', 'camel', 'grey', 'black'],
          'camel': ['white', 'black', 'navy', 'grey'],
          'grey': ['white', 'black', 'navy', 'camel']
        };
        
        const isComplementary = wardrobeColors.some(wColor => 
          complementaryColors[wColor]?.includes(itemColor) ||
          complementaryColors[itemColor]?.includes(wColor)
        );
        
        return isComplementary && occasionItems.includes(item);
      });

      return recommendations.slice(0, 10); // Return top 10 recommendations

    } catch (error) {
      console.error('Error getting outfit recommendations:', error);
      return [];
    }
  }

  // Fallback items when server is unavailable
  private static getFallbackItems(): CountryRoadItem[] {
    return [
      {
        id: 'cr-fallback-1',
        name: 'Classic White Button-Down Shirt',
        price: 89.00,
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b4c?w=300',
        category: 'Tops',
        subcategory: 'Shirts',
        color: 'White',
        size: 'M',
        brand: 'Country Road',
        material: 'Cotton',
        description: 'Classic white button-down shirt',
        url: 'https://countryroad.com.au/shirt-1',
        inStock: true,
        seasonality: ['spring', 'summer', 'autumn'],
        formality: 'smart-casual',
        weatherSuitability: {
          minTemp: 15,
          maxTemp: 30,
          conditions: ['sunny', 'cloudy']
        }
      },
      {
        id: 'cr-fallback-2',
        name: 'High-Waisted Wide-Leg Trousers',
        price: 129.00,
        image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=300',
        category: 'Bottoms',
        subcategory: 'Trousers',
        color: 'Navy',
        size: 'M',
        brand: 'Country Road',
        material: 'Cotton Blend',
        description: 'High-waisted wide-leg trousers',
        url: 'https://countryroad.com.au/trousers-1',
        inStock: true,
        seasonality: ['spring', 'summer', 'autumn', 'winter'],
        formality: 'business',
        weatherSuitability: {
          minTemp: 10,
          maxTemp: 25,
          conditions: ['sunny', 'cloudy', 'rainy']
        }
      }
    ];
  }

  // Convert Country Road item to outfit item format
  static convertToOutfitItem(item: CountryRoadItem): any {
    return {
      id: item.id,
      name: item.name,
      image: item.image,
      category: item.category,
      color: item.color,
      brand: item.brand,
      price: `$${item.price}`,
      isFromWardrobe: false,
      subcategory: item.subcategory,
      tags: [item.material, item.formality, ...item.seasonality],
      material: item.material,
      materialProperties: this.getMaterialProperties(item.material),
      colorAnalysis: this.getColorAnalysis(item.color),
      weatherSuitability: item.weatherSuitability,
      occasionSuitability: this.getOccasionSuitability(item.formality)
    };
  }

  // Get material properties
  private static getMaterialProperties(material: string): any {
    const materials = {
      'cotton': { breathability: 9, warmth: 3, waterResistance: 2, seasonality: ['spring', 'summer', 'autumn'], formality: 'casual' },
      'cotton blend': { breathability: 8, warmth: 4, waterResistance: 3, seasonality: ['spring', 'summer', 'autumn'], formality: 'smart-casual' },
      'wool': { breathability: 6, warmth: 8, waterResistance: 5, seasonality: ['autumn', 'winter'], formality: 'business' },
      'cashmere': { breathability: 7, warmth: 9, waterResistance: 3, seasonality: ['autumn', 'winter'], formality: 'business' },
      'silk': { breathability: 8, warmth: 4, waterResistance: 2, seasonality: ['spring', 'summer', 'autumn'], formality: 'business' },
      'denim': { breathability: 5, warmth: 4, waterResistance: 3, seasonality: ['spring', 'summer', 'autumn', 'winter'], formality: 'casual' },
      'leather': { breathability: 2, warmth: 6, waterResistance: 8, seasonality: ['autumn', 'winter'], formality: 'smart-casual' },
      'linen': { breathability: 10, warmth: 2, waterResistance: 1, seasonality: ['spring', 'summer'], formality: 'casual' }
    };
    return materials[material.toLowerCase()] || materials['cotton'];
  }

  // Get color analysis
  private static getColorAnalysis(color: string): any {
    const colorLower = color.toLowerCase();
    return {
      primary: colorLower,
      secondary: colorLower,
      harmony: 'neutral',
      seasonality: this.getColorSeasonality(colorLower),
      formality: this.getColorFormality(colorLower),
      skinToneCompatibility: ['neutral']
    };
  }

  // Get color seasonality
  private static getColorSeasonality(color: string): string[] {
    if (['white', 'light', 'pastel'].some(c => color.includes(c))) return ['spring', 'summer'];
    if (['dark', 'black', 'navy'].some(c => color.includes(c))) return ['autumn', 'winter'];
    if (['warm', 'earth', 'brown', 'camel'].some(c => color.includes(c))) return ['autumn'];
    return ['spring', 'summer', 'autumn', 'winter'];
  }

  // Get color formality
  private static getColorFormality(color: string): string {
    if (['black', 'navy', 'white'].some(c => color.includes(c))) return 'formal';
    if (['bright', 'neon'].some(c => color.includes(c))) return 'casual';
    return 'smart-casual';
  }

  // Get occasion suitability
  private static getOccasionSuitability(formality: string): string[] {
    switch (formality) {
      case 'casual':
        return ['casual', 'smart-casual'];
      case 'smart-casual':
        return ['casual', 'smart-casual', 'date'];
      case 'business':
        return ['work', 'business', 'smart-casual'];
      case 'formal':
        return ['formal', 'business'];
      default:
        return ['casual'];
    }
  }
}

export default CountryRoadService;
