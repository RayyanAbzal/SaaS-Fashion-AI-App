import { WardrobeItem, OutfitSuggestion, ShoppingItem, User, SwipeHistory, Category } from '../types';
import { WeatherData } from './weatherService';
import { FirestoreService } from './firestoreService';
import ShoppingService from './shoppingService';
import { getCurrentWeather } from './weatherService';

// --- Helper Functions ---

const shuffleArray = <T>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const getComplementaryColor = (color: string): string => {
    const colorMap: { [key: string]: string } = {
        'red': 'green', 'green': 'red',
        'blue': 'orange', 'orange': 'blue',
        'yellow': 'purple', 'purple': 'yellow',
        'black': 'white', 'white': 'black', 'gray': 'black'
    };
    return colorMap[color.toLowerCase()] || 'white';
};

const isNeutral = (color: string): boolean => {
    return ['black', 'white', 'gray', 'beige', 'navy', 'brown'].includes(color.toLowerCase());
};


// --- Scoring Functions ---

const scoreColorHarmony = (itemA: WardrobeItem | ShoppingItem, itemB: WardrobeItem | ShoppingItem): number => {
    const colorA = itemA.color.toLowerCase();
    const colorB = itemB.color.toLowerCase();
    
    if (isNeutral(colorA) || isNeutral(colorB)) return 1.0; // Neutrals go with everything
    if (getComplementaryColor(colorA) === colorB) return 0.8; // Complementary colors are a good match
    if (colorA === colorB) return 0.6; // Monochromatic is okay

    return 0.2;
};

const scoreStyleMatch = (itemA: WardrobeItem | ShoppingItem, itemB: WardrobeItem | ShoppingItem): number => {
    const tagsA = itemA.tags || [];
    const tagsB = itemB.tags || [];
    const commonTags = tagsA.filter(tag => tagsB.includes(tag));
    
    const styleKeywords = ['casual', 'formal', 'streetwear', 'vintage', 'edgy', 'bohemian', 'sporty'];
    const hasCommonStyle = commonTags.some(tag => styleKeywords.includes(tag));

    return hasCommonStyle ? 1.0 : commonTags.length > 0 ? 0.7 : 0.3;
};

const scoreWeatherAppropriateness = (item: WardrobeItem | ShoppingItem, weather: WeatherData): number => {
    const temp = weather.temperature;
    const materials = (item as any).materials as string[] || [];
    let score = 0.5;

    // Material scoring
    if (temp < 10) { // Cold
        if (materials.some(m => ['wool', 'fleece', 'down'].includes(m.toLowerCase()))) score += 0.5;
    } else if (temp > 20) { // Hot
        if (materials.some(m => ['linen', 'cotton', 'viscose'].includes(m.toLowerCase()))) score += 0.5;
    } else { // Mild
        score += 0.2;
    }

    // Category scoring
    const category = item.category;
    if (temp < 10 && category === 'outerwear') score += 0.3;
    if (temp > 20 && ['tops', 'bottoms'].includes(category)) score += 0.1;

    return Math.min(1.0, score);
};


export class StyleService {

    static async getOutfitSuggestions(userId: string): Promise<OutfitSuggestion[]> {
        try {
            if (!userId) {
                console.warn('getOutfitSuggestions called with undefined userId');
                return [];
            }

            // 1. Fetch all data concurrently with error handling
            const [weather, wardrobe, swipeHistory, shoppingItems, user] = await Promise.allSettled([
                getCurrentWeather(),
                FirestoreService.getWardrobeItems(userId),
                FirestoreService.getSwipeHistory(userId),
                ShoppingService.getShoppingFeed(),
                FirestoreService.getUser(userId)
            ]);

            // Extract successful results
            const weatherData = weather.status === 'fulfilled' ? weather.value : null;
            const wardrobeItems = wardrobe.status === 'fulfilled' ? wardrobe.value : [];
            const swipeHistoryData = swipeHistory.status === 'fulfilled' ? swipeHistory.value : [];
            const shoppingItemsData = shoppingItems.status === 'fulfilled' ? shoppingItems.value : [];
            const userData = user.status === 'fulfilled' ? user.value : null;

            // If no user data, return empty array
            if (!userData) {
                console.warn('User not found for outfit suggestions');
                return [];
            }

            // If no weather data, create a default weather object
            const defaultWeather: WeatherData = {
                temperature: 20,
                condition: 'Clear',
                humidity: 60,
                windSpeed: 5,
                description: 'partly cloudy',
                icon: '02d',
                feelsLike: 20
            };
            const weatherToUse = weatherData || defaultWeather;

            const potentialOutfits: (WardrobeItem | ShoppingItem)[][] = [];
            
            // --- Generation Strategies ---

            // Strategy 1: Wardrobe-only outfits (Top + Bottom)
            const tops = wardrobeItems.filter(i => i.category === 'tops');
            const bottoms = wardrobeItems.filter(i => i.category === 'bottoms');
            const shoes = wardrobeItems.filter(i => i.category === 'shoes');

            for (const top of tops) {
                for (const bottom of bottoms) {
                    if (shoes.length > 0) {
                        potentialOutfits.push([top, bottom, shuffleArray(shoes)[0]]);
                    } else {
                        potentialOutfits.push([top, bottom]);
                    }
                }
            }
            
            // Strategy 2: Mix wardrobe with shopping (Top + Shopping Bottom)
            const shoppingBottoms = shoppingItemsData.filter(i => i.category === 'bottoms');
            for (const top of tops) {
                if (shoppingBottoms.length > 0) {
                    potentialOutfits.push([top, shuffleArray(shoppingBottoms)[0]]);
                }
            }

            // Strategy 3: Mix wardrobe with shopping (Bottom + Shopping Top)
            const shoppingTops = shoppingItemsData.filter(i => i.category === 'tops');
            for (const bottom of bottoms) {
                if (shoppingTops.length > 0) {
                    potentialOutfits.push([bottom, shuffleArray(shoppingTops)[0]]);
                }
            }
            
            // Strategy 4: Full shopping outfit (if wardrobe is limited)
            if (wardrobeItems.length < 5) {
                const randomTop = shuffleArray(shoppingTops)[0];
                const randomBottom = shuffleArray(shoppingBottoms)[0];
                const randomShoes = shuffleArray(shoppingItemsData.filter(i => i.category === 'shoes'))[0];
                if (randomTop && randomBottom && randomShoes) {
                    potentialOutfits.push([randomTop, randomBottom, randomShoes]);
                }
            }

            // If no potential outfits, create some mock suggestions
            if (potentialOutfits.length === 0) {
                console.log('No potential outfits found, creating mock suggestions');
                return this.createMockSuggestions(weatherToUse);
            }

            // 2. Score and Rank Outfits
            const scoredSuggestions = potentialOutfits.map((outfitItems, index) => {
                const [item1, item2] = outfitItems;

                const colorScore = scoreColorHarmony(item1, item2);
                const styleScore = scoreStyleMatch(item1, item2);
                const weatherScore = outfitItems.reduce((acc, currentItem) => acc + scoreWeatherAppropriateness(currentItem, weatherToUse), 0) / outfitItems.length;

                const totalScore = (colorScore * 0.4) + (styleScore * 0.3) + (weatherScore * 0.3);

                let reasoning = `This is a great look. The ${item1.color} ${item1.name} and ${item2.color} ${item2.name} work well together.`;
                if (colorScore > 0.7) reasoning += ` The colors are a fantastic match.`;
                if (styleScore > 0.7) reasoning += ` It's a perfect ${item1.tags?.includes('casual') ? 'casual' : 'stylish'} vibe.`;
                if (weatherScore > 0.7) reasoning += ` Plus, it's just right for today's weather.`;

                return {
                    id: `suggestion-${Date.now()}-${index}`,
                    items: outfitItems as ShoppingItem[], // Cast for simplicity, real app needs better type guard
                    reasoning: reasoning,
                    occasion: 'casual', // Placeholder
                    weather: [weatherToUse.condition]
                };
            });

            // 3. Sort and select top 3
            const sortedSuggestions = scoredSuggestions.sort((a, b) => {
                // Sort by reasoning length as a simple proxy for quality
                return b.reasoning.length - a.reasoning.length;
            });
            
            return sortedSuggestions.slice(0, 3);
        } catch (error) {
            console.error('Error in getOutfitSuggestions:', error);
            // Return mock suggestions as fallback
            return this.createMockSuggestions({
                temperature: 20,
                condition: 'Clear',
                humidity: 60,
                windSpeed: 5,
                description: 'partly cloudy',
                icon: '02d',
                feelsLike: 20
            });
        }
    }

    private static createMockSuggestions(weather: WeatherData): OutfitSuggestion[] {
        const mockItems: ShoppingItem[] = [
            {
                id: 'mock-1',
                name: 'Classic White T-Shirt',
                brand: 'Basic Brand',
                price: 25,
                imageUrl: 'https://via.placeholder.com/300x400/FFFFFF/000000?text=White+T-Shirt',
                purchaseUrl: '#',
                productUrl: '#',
                category: 'tops',
                color: 'white',
                description: 'A comfortable and versatile white t-shirt'
            },
            {
                id: 'mock-2',
                name: 'Blue Denim Jeans',
                brand: 'Denim Co',
                price: 80,
                imageUrl: 'https://via.placeholder.com/300x400/0000FF/FFFFFF?text=Blue+Jeans',
                purchaseUrl: '#',
                productUrl: '#',
                category: 'bottoms',
                color: 'blue',
                description: 'Classic blue denim jeans'
            },
            {
                id: 'mock-3',
                name: 'Black Sneakers',
                brand: 'Shoe Brand',
                price: 120,
                imageUrl: 'https://via.placeholder.com/300x400/000000/FFFFFF?text=Black+Sneakers',
                purchaseUrl: '#',
                productUrl: '#',
                category: 'shoes',
                color: 'black',
                description: 'Comfortable black sneakers'
            }
        ];

        return [
            {
                id: 'mock-suggestion-1',
                items: [mockItems[0], mockItems[1]],
                reasoning: 'A classic combination that never goes out of style. The white t-shirt and blue jeans create a timeless look.',
                occasion: 'casual',
                weather: [weather.condition]
            },
            {
                id: 'mock-suggestion-2',
                items: [mockItems[0], mockItems[1], mockItems[2]],
                reasoning: 'Complete your look with these comfortable black sneakers. Perfect for a casual day out.',
                occasion: 'casual',
                weather: [weather.condition]
            }
        ];
    }
} 