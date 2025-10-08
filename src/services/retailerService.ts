// Online Retailer Integration Service - Connect with fashion retailers
import { RetailerItem, ShoppingSuggestion, UserAvatar } from './enhancedOracleService';
import { AvatarService } from './avatarService';

export interface RetailerAPI {
  name: string;
  baseUrl: string;
  apiKey?: string;
  categories: string[];
  priceRange: { min: number; max: number };
}

export interface SearchFilters {
  category?: string;
  subcategory?: string;
  color?: string;
  brand?: string;
  priceMin?: number;
  priceMax?: number;
  size?: string;
  occasion?: string;
  trendLevel?: 'basic' | 'trendy' | 'fashion-forward';
}

export interface ShoppingCart {
  items: RetailerItem[];
  total: number;
  currency: string;
  estimatedShipping: number;
  discounts: Array<{
    code: string;
    amount: number;
    type: 'percentage' | 'fixed';
  }>;
}

export class RetailerService {
  // Mock retailer APIs (in real app, these would be actual API integrations)
  private static retailers: RetailerAPI[] = [
    {
      name: 'Zara',
      baseUrl: 'https://api.zara.com',
      categories: ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Accessories', 'Shoes'],
      priceRange: { min: 20, max: 200 },
    },
    {
      name: 'H&M',
      baseUrl: 'https://api.hm.com',
      categories: ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Accessories', 'Shoes'],
      priceRange: { min: 10, max: 150 },
    },
    {
      name: 'ASOS',
      baseUrl: 'https://api.asos.com',
      categories: ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Accessories', 'Shoes'],
      priceRange: { min: 15, max: 300 },
    },
    {
      name: 'COS',
      baseUrl: 'https://api.cosstores.com',
      categories: ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Accessories'],
      priceRange: { min: 30, max: 400 },
    },
    {
      name: 'Mango',
      baseUrl: 'https://api.mango.com',
      categories: ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Accessories', 'Shoes'],
      priceRange: { min: 25, max: 250 },
    },
    {
      name: 'Uniqlo',
      baseUrl: 'https://api.uniqlo.com',
      categories: ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Accessories'],
      priceRange: { min: 15, max: 100 },
    },
  ];

  // Mock product database (in real app, this would come from APIs)
  private static mockProducts: RetailerItem[] = [
    // Zara products
    {
      id: 'zara-1',
      name: 'Oversized Blazer',
      brand: 'Zara',
      price: 89,
      originalPrice: 129,
      imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=300&fit=crop',
      retailer: 'Zara',
      category: 'Outerwear',
      subcategory: 'Blazer',
      color: 'Black',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Black', 'Navy', 'Camel'],
      tags: ['blazer', 'oversized', 'professional', 'trendy'],
      styleMatch: 92,
      isFromWardrobe: false,
    },
    {
      id: 'zara-2',
      name: 'High-Waisted Jeans',
      brand: 'Zara',
      price: 45,
      originalPrice: 65,
      imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=300&fit=crop',
      retailer: 'Zara',
      category: 'Bottoms',
      subcategory: 'Jeans',
      color: 'Blue',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Blue', 'Black', 'White'],
      tags: ['jeans', 'high-waisted', 'denim', 'casual'],
      styleMatch: 88,
      isFromWardrobe: false,
    },
    // H&M products
    {
      id: 'hm-1',
      name: 'Silk Blouse',
      brand: 'H&M',
      price: 35,
      originalPrice: 49,
      imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=300&fit=crop',
      retailer: 'H&M',
      category: 'Tops',
      subcategory: 'Blouse',
      color: 'White',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['White', 'Black', 'Navy', 'Pink'],
      tags: ['blouse', 'silk', 'professional', 'elegant'],
      styleMatch: 85,
      isFromWardrobe: false,
    },
    {
      id: 'hm-2',
      name: 'Midi Dress',
      brand: 'H&M',
      price: 55,
      originalPrice: 79,
      imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=300&fit=crop',
      retailer: 'H&M',
      category: 'Dresses',
      subcategory: 'Dress',
      color: 'Black',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Black', 'Navy', 'Red'],
      tags: ['dress', 'midi', 'elegant', 'versatile'],
      styleMatch: 90,
      isFromWardrobe: false,
    },
    // ASOS products
    {
      id: 'asos-1',
      name: 'Leather Jacket',
      brand: 'ASOS',
      price: 120,
      originalPrice: 180,
      imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop',
      retailer: 'ASOS',
      category: 'Outerwear',
      subcategory: 'Jacket',
      color: 'Black',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Black', 'Brown', 'Tan'],
      tags: ['leather', 'jacket', 'edgy', 'cool'],
      styleMatch: 88,
      isFromWardrobe: false,
    },
    {
      id: 'asos-2',
      name: 'Statement Earrings',
      brand: 'ASOS',
      price: 25,
      originalPrice: 35,
      imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&h=300&fit=crop',
      retailer: 'ASOS',
      category: 'Accessories',
      subcategory: 'Earrings',
      color: 'Gold',
      sizes: ['One Size'],
      colors: ['Gold', 'Silver', 'Rose Gold'],
      tags: ['earrings', 'statement', 'gold', 'elegant'],
      styleMatch: 82,
      isFromWardrobe: false,
    },
    // COS products
    {
      id: 'cos-1',
      name: 'Wool Coat',
      brand: 'COS',
      price: 180,
      originalPrice: 250,
      imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop',
      retailer: 'COS',
      category: 'Outerwear',
      subcategory: 'Coat',
      color: 'Camel',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Camel', 'Black', 'Navy'],
      tags: ['coat', 'wool', 'minimalist', 'luxury'],
      styleMatch: 95,
      isFromWardrobe: false,
    },
    {
      id: 'cos-2',
      name: 'Wide-Leg Trousers',
      brand: 'COS',
      price: 95,
      originalPrice: 135,
      imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=300&fit=crop',
      retailer: 'COS',
      category: 'Bottoms',
      subcategory: 'Trousers',
      color: 'Black',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Black', 'Navy', 'Gray'],
      tags: ['trousers', 'wide-leg', 'minimalist', 'professional'],
      styleMatch: 92,
      isFromWardrobe: false,
    },
    // Mango products
    {
      id: 'mango-1',
      name: 'Knit Sweater',
      brand: 'Mango',
      price: 65,
      originalPrice: 89,
      imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=300&fit=crop',
      retailer: 'Mango',
      category: 'Tops',
      subcategory: 'Sweater',
      color: 'Cream',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Cream', 'Black', 'Navy', 'Pink'],
      tags: ['sweater', 'knit', 'cozy', 'casual'],
      styleMatch: 87,
      isFromWardrobe: false,
    },
    {
      id: 'mango-2',
      name: 'Ankle Boots',
      brand: 'Mango',
      price: 85,
      originalPrice: 120,
      imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=300&fit=crop',
      retailer: 'Mango',
      category: 'Shoes',
      subcategory: 'Boots',
      color: 'Black',
      sizes: ['6', '7', '8', '9', '10'],
      colors: ['Black', 'Brown', 'Tan'],
      tags: ['boots', 'ankle', 'leather', 'versatile'],
      styleMatch: 89,
      isFromWardrobe: false,
    },
    // Uniqlo products
    {
      id: 'uniqlo-1',
      name: 'Basic T-Shirt',
      brand: 'Uniqlo',
      price: 15,
      originalPrice: 20,
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
      retailer: 'Uniqlo',
      category: 'Tops',
      subcategory: 'T-shirt',
      color: 'White',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['White', 'Black', 'Navy', 'Gray'],
      tags: ['t-shirt', 'basic', 'cotton', 'casual'],
      styleMatch: 80,
      isFromWardrobe: false,
    },
    {
      id: 'uniqlo-2',
      name: 'Denim Jacket',
      brand: 'Uniqlo',
      price: 45,
      originalPrice: 65,
      imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop',
      retailer: 'Uniqlo',
      category: 'Outerwear',
      subcategory: 'Jacket',
      color: 'Blue',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Blue', 'Black', 'White'],
      tags: ['jacket', 'denim', 'casual', 'versatile'],
      styleMatch: 83,
      isFromWardrobe: false,
    },
  ];

  // Search products across retailers
  static async searchProducts(
    filters: SearchFilters,
    userAvatar?: UserAvatar
  ): Promise<RetailerItem[]> {
    let results = [...this.mockProducts];
    
    // Apply filters
    if (filters.category) {
      results = results.filter(item => 
        item.category.toLowerCase() === filters.category!.toLowerCase()
      );
    }
    
    if (filters.subcategory) {
      results = results.filter(item => 
        item.subcategory.toLowerCase() === filters.subcategory!.toLowerCase()
      );
    }
    
    if (filters.color) {
      results = results.filter(item => 
        item.color.toLowerCase() === filters.color!.toLowerCase()
      );
    }
    
    if (filters.brand) {
      results = results.filter(item => 
        item.brand.toLowerCase() === filters.brand!.toLowerCase()
      );
    }
    
    if (filters.priceMin !== undefined) {
      results = results.filter(item => item.price >= filters.priceMin!);
    }
    
    if (filters.priceMax !== undefined) {
      results = results.filter(item => item.price <= filters.priceMax!);
    }
    
    if (filters.size) {
      results = results.filter(item => 
        item.sizes.includes(filters.size!)
      );
    }
    
    // Add fit predictions if user avatar is provided
    if (userAvatar) {
      results = results.map(item => ({
        ...item,
        fitPrediction: AvatarService.predictFit(item, userAvatar),
      }));
    }
    
    // Sort by style match and price
    results.sort((a, b) => {
      if (a.styleMatch !== b.styleMatch) {
        return b.styleMatch - a.styleMatch;
      }
      return a.price - b.price;
    });
    
    return results;
  }

  // Get outfit completion suggestions
  static async getOutfitCompletionSuggestions(
    currentOutfit: Array<{ category: string; subcategory: string; color: string }>,
    occasion: string,
    userAvatar?: UserAvatar
  ): Promise<ShoppingSuggestion[]> {
    const suggestions: ShoppingSuggestion[] = [];
    const categories = currentOutfit.map(item => item.category.toLowerCase());
    const colors = currentOutfit.map(item => item.color.toLowerCase());
    
    // Check for missing essential pieces
    if (!categories.includes('shoes') && (occasion === 'professional' || occasion === 'date')) {
      const shoes = await this.searchProducts({
        category: 'Shoes',
        occasion: occasion,
      }, userAvatar);
      
      if (shoes.length > 0) {
        suggestions.push({
          item: shoes[0],
          reason: 'Complete your look with the perfect footwear',
          outfitContext: `Essential for ${occasion} occasions`,
          urgency: 'high',
          alternatives: shoes.slice(1, 4),
          priceRange: {
            min: Math.min(...shoes.map(s => s.price)),
            max: Math.max(...shoes.map(s => s.price)),
            currency: 'USD',
          },
        });
      }
    }
    
    if (!categories.includes('accessories') && (occasion === 'date' || occasion === 'party')) {
      const accessories = await this.searchProducts({
        category: 'Accessories',
        occasion: occasion,
      }, userAvatar);
      
      if (accessories.length > 0) {
        suggestions.push({
          item: accessories[0],
          reason: 'Add the perfect finishing touch',
          outfitContext: 'Elevates your look with minimal effort',
          urgency: 'medium',
          alternatives: accessories.slice(1, 4),
          priceRange: {
            min: Math.min(...accessories.map(a => a.price)),
            max: Math.max(...accessories.map(a => a.price)),
            currency: 'USD',
          },
        });
      }
    }
    
    if (!categories.includes('outerwear') && occasion === 'professional') {
      const outerwear = await this.searchProducts({
        category: 'Outerwear',
        occasion: occasion,
      }, userAvatar);
      
      if (outerwear.length > 0) {
        suggestions.push({
          item: outerwear[0],
          reason: 'Professional outerwear for confidence',
          outfitContext: 'Essential for business settings',
          urgency: 'high',
          alternatives: outerwear.slice(1, 4),
          priceRange: {
            min: Math.min(...outerwear.map(o => o.price)),
            max: Math.max(...outerwear.map(o => o.price)),
            currency: 'USD',
          },
        });
      }
    }
    
    return suggestions;
  }

  // Get similar items
  static async getSimilarItems(
    referenceItem: RetailerItem,
    userAvatar?: UserAvatar
  ): Promise<RetailerItem[]> {
    const similarItems = await this.searchProducts({
      category: referenceItem.category,
      subcategory: referenceItem.subcategory,
      color: referenceItem.color,
    }, userAvatar);
    
    // Filter out the reference item and sort by similarity
    return similarItems
      .filter(item => item.id !== referenceItem.id)
      .sort((a, b) => b.styleMatch - a.styleMatch)
      .slice(0, 6);
  }

  // Get price alerts
  static async getPriceAlerts(
    itemIds: string[],
    targetPrice?: number
  ): Promise<Array<{ item: RetailerItem; currentPrice: number; originalPrice: number; discount: number }>> {
    const alerts = [];
    
    for (const itemId of itemIds) {
      const item = this.mockProducts.find(p => p.id === itemId);
      if (item && item.originalPrice && item.price < item.originalPrice) {
        const discount = Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
        
        if (!targetPrice || item.price <= targetPrice) {
          alerts.push({
            item,
            currentPrice: item.price,
            originalPrice: item.originalPrice,
            discount,
          });
        }
      }
    }
    
    return alerts;
  }

  // Create shopping cart
  static createShoppingCart(items: RetailerItem[]): ShoppingCart {
    const total = items.reduce((sum, item) => sum + item.price, 0);
    const estimatedShipping = total > 100 ? 0 : 9.99; // Free shipping over $100
    
    return {
      items,
      total: total + estimatedShipping,
      currency: 'USD',
      estimatedShipping,
      discounts: [],
    };
  }

  // Add discount to cart
  static addDiscount(
    cart: ShoppingCart,
    code: string,
    amount: number,
    type: 'percentage' | 'fixed'
  ): ShoppingCart {
    const discount = {
      code,
      amount,
      type,
    };
    
    const discountAmount = type === 'percentage' 
      ? (cart.total * amount) / 100 
      : amount;
    
    return {
      ...cart,
      total: Math.max(0, cart.total - discountAmount),
      discounts: [...cart.discounts, discount],
    };
  }

  // Get trending items
  static async getTrendingItems(
    category?: string,
    limit: number = 10
  ): Promise<RetailerItem[]> {
    let results = [...this.mockProducts];
    
    if (category) {
      results = results.filter(item => 
        item.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Sort by style match (trendiness) and return top items
    return results
      .sort((a, b) => b.styleMatch - a.styleMatch)
      .slice(0, limit);
  }

  // Get size guide
  static getSizeGuide(brand: string, category: string): Array<{
    size: string;
    bust: { min: number; max: number };
    waist: { min: number; max: number };
    hips: { min: number; max: number };
  }> {
    // Mock size guide data
    const sizeGuides = {
      'Zara': [
        { size: 'XS', bust: { min: 32, max: 34 }, waist: { min: 24, max: 26 }, hips: { min: 34, max: 36 } },
        { size: 'S', bust: { min: 34, max: 36 }, waist: { min: 26, max: 28 }, hips: { min: 36, max: 38 } },
        { size: 'M', bust: { min: 36, max: 38 }, waist: { min: 28, max: 30 }, hips: { min: 38, max: 40 } },
        { size: 'L', bust: { min: 38, max: 40 }, waist: { min: 30, max: 32 }, hips: { min: 40, max: 42 } },
        { size: 'XL', bust: { min: 40, max: 42 }, waist: { min: 32, max: 34 }, hips: { min: 42, max: 44 } },
      ],
      'H&M': [
        { size: 'XS', bust: { min: 32, max: 34 }, waist: { min: 24, max: 26 }, hips: { min: 34, max: 36 } },
        { size: 'S', bust: { min: 34, max: 36 }, waist: { min: 26, max: 28 }, hips: { min: 36, max: 38 } },
        { size: 'M', bust: { min: 36, max: 38 }, waist: { min: 28, max: 30 }, hips: { min: 38, max: 40 } },
        { size: 'L', bust: { min: 38, max: 40 }, waist: { min: 30, max: 32 }, hips: { min: 40, max: 42 } },
        { size: 'XL', bust: { min: 40, max: 42 }, waist: { min: 32, max: 34 }, hips: { min: 42, max: 44 } },
      ],
    };
    
    return sizeGuides[brand as keyof typeof sizeGuides] || sizeGuides['Zara'];
  }
}
