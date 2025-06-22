import { ShoppingItem, Category } from '../types';
import axios from 'axios';

// The base URL for your local scraper server.
// NOTE: For iOS, this is usually correct. For Android emulators, you may need to use http://10.0.2.2:3000
const API_BASE_URL = 'http://localhost:3000/api';

class ShoppingService {
  /**
   * Fetches the live shopping feed from your local backend server.
   */
  static async getShoppingFeed(): Promise<ShoppingItem[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/shopping-feed`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.code === 'ERR_NETWORK') {
        console.error('Failed to fetch shopping feed. Is the server running? Run `npm run dev` in the /server directory.');
      } else {
        console.error('Failed to fetch shopping feed:', error);
      }
      return []; // Fallback to an empty array on error
    }
  }

  /**
   * Finds complementary items based on the live shopping feed.
   * This logic remains on the client for now but could be moved to the backend.
   */
  static async findComplementaryItems(
    existingItems: ShoppingItem[],
    categoryNeeded: Category
  ): Promise<ShoppingItem[]> {
    const availableItems = await this.getShoppingFeed();
    
    const complementary = availableItems.filter(item => {
      return item.category === categoryNeeded && !existingItems.some(existing => existing.id === item.id);
    });

    return complementary.sort(() => 0.5 - Math.random()).slice(0, 5);
  }

  /**
   * Searches for items in the live shopping feed.
   * This logic also remains on the client side for now.
   */
  static async searchShoppingItems(query: string): Promise<ShoppingItem[]> {
    const availableItems = await this.getShoppingFeed();
    const lowerQuery = query.toLowerCase();
    
    return availableItems.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) ||
      item.brand.toLowerCase().includes(lowerQuery) ||
      (item.description && item.description.toLowerCase().includes(lowerQuery)) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    );
  }
}

export default ShoppingService; 