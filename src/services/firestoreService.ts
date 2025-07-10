import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  writeBatch,
  runTransaction,
  increment,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  User,
  WardrobeItem,
  Outfit,
  ChatMessage,
  SwipeHistory,
  Notification,
  Achievement,
} from '../types';
import { AuthService } from './authService';

// User Preferences for Reinforcement Learning
export interface UserPreference {
  userId: string;
  itemId: string;
  category: string;
  color: string;
  brand: string;
  tags: string[];
  preference: 'like' | 'dislike' | 'neutral';
  confidence: number;
  timestamp: Date;
}

export interface PreferenceScore {
  itemId: string;
  category: string;
  color: string;
  brand: string;
  tags: string[];
  likeScore: number;
  dislikeScore: number;
  totalInteractions: number;
  lastUpdated: Date;
}

export class FirestoreService {
  // User Operations
  static async getUser(userId: string): Promise<User | null> {
    try {
      if (!userId) {
        console.warn('getUser called with undefined userId');
        return null;
      }
      
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists() ? (userDoc.data() as User) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null; // Return null instead of throwing
    }
  }

  static async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { ...updates, updatedAt: new Date() }, { merge: true });
  }

  // Wardrobe Operations
  static onWardrobeUpdate(userId: string, onUpdate: (items: WardrobeItem[]) => void, onError: (error: any) => void) {
    try {
      if (!userId) {
        console.warn('onWardrobeUpdate called with undefined userId');
        onError(new Error('User ID is required'));
        return () => {};
      }

      const wardrobeRef = collection(db, 'users', userId, 'wardrobe');
      return onSnapshot(wardrobeRef, 
        (snapshot) => {
          try {
            const items = snapshot.docs.map(doc => Object.assign({}, doc.data(), { id: doc.id }));
            const validItems = items.filter(item => item.id && item.name && item.category && item.brand && item.color && item.imageUrl && item.userId).map(item => item as WardrobeItem);
            
            onUpdate(validItems);
          } catch (error) {
            console.error('Error processing wardrobe items:', error);
            onError(error);
          }
        },
        (error) => {
          console.error("Error in onWardrobeUpdate listener: ", error);
          onError(error);
        }
      );
    } catch (error) {
      console.error('Error setting up wardrobe listener:', error);
      onError(error);
      return () => {};
    }
  }

  static getNewId(): string {
    // This is a client-side way to get a new unique ID.
    return doc(collection(db, 'dummy')).id;
  }

  static async addWardrobeItem(item: WardrobeItem): Promise<void> {
    // Check for duplicates based on image similarity and metadata
    const existingItems = await this.checkForDuplicates(item);
    if (existingItems.length > 0) {
      throw new Error('A similar item already exists in your wardrobe.');
    }
    
    await setDoc(doc(db, 'users', item.userId, 'wardrobe', item.id), item);
  }

  static async updateWardrobeItem(item: WardrobeItem): Promise<void> {
    const itemRef = doc(db, 'users', item.userId, 'wardrobe', item.id);
    await updateDoc(itemRef, { ...item, updatedAt: new Date() });
  }

  private static async checkForDuplicates(newItem: WardrobeItem): Promise<WardrobeItem[]> {
    try {
      // Get all items in the user's wardrobe
      const wardrobeRef = collection(db, 'users', newItem.userId, 'wardrobe');
      const snapshot = await getDocs(wardrobeRef);
      const existingItems = snapshot.docs.map(doc => Object.assign({}, doc.data(), { id: doc.id }));

      // Check for duplicates based on multiple criteria
      return existingItems.filter(item => {
        // Skip comparing with itself (for updates)
        if (item.id === newItem.id) return false;

        // Check for exact image URL match (same image uploaded multiple times)
        if (item.imageUrl === newItem.imageUrl) return true;

        // Check for similar items based on metadata
        const isSimilar = (
          item.name.toLowerCase() === newItem.name.toLowerCase() &&
          item.category === newItem.category &&
          item.brand.toLowerCase() === newItem.brand.toLowerCase() &&
          item.color.toLowerCase() === newItem.color.toLowerCase()
        );

        // If we have AI analysis, use it for more accurate comparison
        if (item.aiAnalysis && newItem.aiAnalysis) {
          const confidenceThreshold = 0.9; // 90% confidence threshold
          const isSimilarByAI = (
            item.aiAnalysis.category === newItem.aiAnalysis.category &&
            item.aiAnalysis.confidence > confidenceThreshold &&
            newItem.aiAnalysis.confidence > confidenceThreshold
          );
          return isSimilar && isSimilarByAI;
        }

        return isSimilar;
      });
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return []; // Return empty array on error to allow save
    }
  }

  static async deleteWardrobeItem(userId: string, itemId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', userId, 'wardrobe', itemId));
  }
  
  static async getWardrobeItems(userId: string): Promise<WardrobeItem[]> {
    try {
      if (!userId) {
        console.warn('getWardrobeItems called with undefined userId');
        return [];
      }
      
      const itemsCol = collection(db, 'users', userId, 'wardrobe');
      const itemSnapshot = await getDocs(query(itemsCol, orderBy('createdAt', 'desc')));
      const items = itemSnapshot.docs.map(doc => Object.assign({}, doc.data(), { id: doc.id }));

      // Filter for required fields and then cast to WardrobeItem[]
      const validItems = items.filter(item => item.id && item.name && item.category && item.brand && item.color && item.imageUrl && item.userId).map(item => item as WardrobeItem);
      return validItems;
    } catch (error) {
      console.error('Error getting wardrobe items:', error);
      return []; // Return empty array instead of throwing
    }
  }

  // Outfit Operations
  static async getOutfits(userId: string): Promise<Outfit[]> {
    const outfitsCol = collection(db, 'users', userId, 'outfits');
    const outfitSnapshot = await getDocs(query(outfitsCol, orderBy('createdAt', 'desc')));
    return outfitSnapshot.docs.map(doc => doc.data() as Outfit);
  }

  static async deleteOutfit(userId: string, outfitId: string): Promise<void> {
    try {
      const outfitRef = doc(db, 'users', userId, 'outfits', outfitId);
      await deleteDoc(outfitRef);
    } catch (error) {
      console.error('Error deleting outfit:', error);
      throw error;
    }
  }
  
  static async addSwipeRecord(userId: string, outfitId: string, action: 'like' | 'dislike' | 'superlike', context: any): Promise<void> {
    const swipeHistoryCol = collection(db, 'users', userId, 'swipeHistory');
    await addDoc(swipeHistoryCol, {
      outfitId,
      action,
      context,
      timestamp: new Date(),
    });
  }

  // Chat Operations
  static async getChatMessages(userId: string, limitCount: number = 50): Promise<ChatMessage[]> {
    try {
      const q = query(
        collection(db, 'chat_messages'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as ChatMessage[];
    } catch (error) {
      console.error('Error getting chat messages:', error);
      throw error;
    }
  }

  static async addChatMessage(message: Omit<ChatMessage, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'chat_messages'), {
        ...message,
        timestamp: new Date(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding chat message:', error);
      throw error;
    }
  }

  // Swipe History Operations
  static async getSwipeHistory(userId: string): Promise<SwipeHistory[]> {
    try {
      if (!userId) {
        console.warn('getSwipeHistory called with undefined userId');
        return [];
      }
      
      // Use proper index for efficient querying
      const q = query(
        collection(db, 'swipe_history'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(100) // Limit to last 100 swipes for better performance
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as SwipeHistory[];
    } catch (error) {
      if (error instanceof Error && error.message.includes('missing index')) {
        console.error('Missing Firestore index. Please create the following index:');
        console.error('Collection: swipe_history');
        console.error('Fields indexed: userId Ascending, timestamp Descending');
        // Return unordered results as fallback
        const fallbackQuery = query(
          collection(db, 'swipe_history'),
          where('userId', '==', userId)
        );
        const fallbackSnapshot = await getDocs(fallbackQuery);
        const results = fallbackSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as SwipeHistory[];
        return results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
      console.error('Error getting swipe history:', error);
      return []; // Return empty array instead of throwing
    }
  }

  static async addSwipeHistory(swipe: Omit<SwipeHistory, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'swipe_history'), {
        ...swipe,
        timestamp: new Date(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding swipe history:', error);
      throw error;
    }
  }

  // Notification Operations
  static async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Notification[];
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  static async addNotification(notification: Omit<Notification, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: new Date(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding notification:', error);
      throw error;
    }
  }

  static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Achievement Operations
  static async getAchievements(userId: string): Promise<Achievement[]> {
    try {
      const q = query(
        collection(db, 'achievements'),
        where('userId', '==', userId),
        orderBy('unlockedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Achievement[];
    } catch (error) {
      console.error('Error getting achievements:', error);
      throw error;
    }
  }

  static async addAchievement(achievement: Omit<Achievement, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'achievements'), {
        ...achievement,
        unlockedAt: new Date(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding achievement:', error);
      throw error;
    }
  }

  // Real-time Listeners
  static subscribeToWardrobeItems(userId: string, callback: (items: WardrobeItem[]) => void) {
    const q = query(
      collection(db, 'users', userId, 'wardrobe'),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const items = querySnapshot.docs.map(doc => Object.assign({}, doc.data(), { id: doc.id }));
      const validItems = items.filter(item => item.id && item.name && item.category && item.brand && item.color && item.imageUrl && item.userId).map(item => item as WardrobeItem);
      callback(validItems);
    });
  }

  static subscribeToOutfits(userId: string, callback: (outfits: Outfit[]) => void) {
    const q = query(
      collection(db, 'users', userId, 'outfits'),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const outfits = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Outfit[];
      callback(outfits);
    });
  }

  static subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const notifications = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Notification[];
      callback(notifications);
    });
  }

  // Batch Operations
  static async batchUpdateWardrobeItems(updates: { id: string; updates: Partial<WardrobeItem> }[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      updates.forEach(({ id, updates: itemUpdates }) => {
        const itemRef = doc(db, 'users', id, 'wardrobe', id);
        batch.update(itemRef, {
          ...itemUpdates,
          updatedAt: new Date(),
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error batch updating wardrobe items:', error);
      throw error;
    }
  }

  // Transaction Operations
  static async createOutfitWithItems(
    outfit: Omit<Outfit, 'id'>,
    itemIds: string[]
  ): Promise<string> {
    try {
      return await runTransaction(db, async (transaction) => {
        // Create the outfit
        const outfitRef = doc(collection(db, 'users', outfit.userId, 'outfits'));
        transaction.set(outfitRef, {
          ...outfit,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Update wear count for items
        itemIds.forEach(itemId => {
          const itemRef = doc(db, 'users', outfit.userId, 'wardrobe', itemId);
          transaction.update(itemRef, {
            wearCount: increment(1),
            lastWorn: new Date(),
            updatedAt: new Date(),
          });
        });

        return outfitRef.id;
      });
    } catch (error) {
      console.error('Error creating outfit with items:', error);
      throw error;
    }
  }

  // Search and Filter Operations
  static async searchWardrobeItems(
    userId: string,
    searchTerm: string,
    category?: string,
    color?: string
  ): Promise<WardrobeItem[]> {
    try {
      let q = query(
        collection(db, 'users', userId, 'wardrobe'),
        where('userId', '==', userId)
      );

      if (category && category !== 'all') {
        q = query(q, where('category', '==', category));
      }

      if (color) {
        q = query(q, where('color', '==', color));
      }

      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => Object.assign({}, doc.data(), { id: doc.id }));

      // Filter by search term in memory for better performance
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const validItems = items.filter(item =>
          item.name.toLowerCase().includes(term) ||
          item.brand.toLowerCase().includes(term) ||
          item.tags.some((tag: string) => tag.toLowerCase().includes(term))
        );
        return validItems.filter(item => item.id && item.name && item.category && item.brand && item.color && item.imageUrl && item.userId).map(item => item as WardrobeItem);
      }

      const validItems = items.filter(item => item.id && item.name && item.category && item.brand && item.color && item.imageUrl && item.userId).map(item => item as WardrobeItem);
      return validItems;
    } catch (error) {
      console.error('Error searching wardrobe items:', error);
      throw error;
    }
  }

  // Analytics Operations
  static async getWardrobeAnalytics(userId: string): Promise<{
    totalItems: number;
    categoryBreakdown: { [key: string]: number };
    colorBreakdown: { [key: string]: number };
    brandBreakdown: { [key: string]: number };
    mostWornItems: WardrobeItem[];
  }> {
    try {
      const items = await this.getWardrobeItems(userId);
      
      const categoryBreakdown: { [key: string]: number } = {};
      const colorBreakdown: { [key: string]: number } = {};
      const brandBreakdown: { [key: string]: number } = {};

      items.forEach(item => {
        categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1;
        colorBreakdown[item.color] = (colorBreakdown[item.color] || 0) + 1;
        brandBreakdown[item.brand] = (brandBreakdown[item.brand] || 0) + 1;
      });

      const mostWornItems = items
        .sort((a, b) => b.wearCount - a.wearCount)
        .slice(0, 5);

      return {
        totalItems: items.length,
        categoryBreakdown,
        colorBreakdown,
        brandBreakdown,
        mostWornItems,
      };
    } catch (error) {
      console.error('Error getting wardrobe analytics:', error);
      throw error;
    }
  }

  static async getRetailerProducts(category?: string, color?: string): Promise<any[]> {
    try {
      let q = collection(db, 'shopping_products');
      let queryRef = q as any;
      if (category) queryRef = query(queryRef, where('category', '==', category));
      if (color) queryRef = query(queryRef, where('color', '==', color));
      const snapshot = await getDocs(queryRef);
      return snapshot.docs.map(doc => Object.assign({}, doc.data(), { id: doc.id })) as any[];
    } catch (error) {
      console.error('Error fetching retailer products:', error);
      return [];
    }
  }

  // Save user preferences for reinforcement learning
  static async saveUserPreferences(userId: string, preferences: UserPreference[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      for (const preference of preferences) {
        const prefRef = doc(db, 'user_preferences', `${userId}_${preference.itemId}_${Date.now()}`);
        batch.set(prefRef, {
          ...preference,
          timestamp: preference.timestamp.toISOString(),
        });
      }
      
      await batch.commit();
      console.log(`[Firestore] Saved ${preferences.length} preferences for user ${userId}`);
    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw error;
    }
  }

  // Load user preferences for reinforcement learning
  static async loadUserPreferences(userId: string): Promise<UserPreference[]> {
    try {
      const preferencesRef = collection(db, 'user_preferences');
      const q = query(
        preferencesRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(1000) // Limit to last 1000 preferences
      );
      
      const snapshot = await getDocs(q);
      const preferences: UserPreference[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        preferences.push({
          ...data,
          timestamp: new Date(data.timestamp),
        } as UserPreference);
      });
      
      console.log(`[Firestore] Loaded ${preferences.length} preferences for user ${userId}`);
      return preferences;
    } catch (error) {
      console.error('Error loading user preferences:', error);
      return [];
    }
  }

  // Save preference scores for faster lookup
  static async savePreferenceScores(userId: string, scores: PreferenceScore[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      for (const score of scores) {
        const scoreRef = doc(db, 'preference_scores', `${userId}_${score.itemId}`);
        batch.set(scoreRef, {
          ...score,
          lastUpdated: score.lastUpdated.toISOString(),
        });
      }
      
      await batch.commit();
      console.log(`[Firestore] Saved ${scores.length} preference scores for user ${userId}`);
    } catch (error) {
      console.error('Error saving preference scores:', error);
      throw error;
    }
  }

  // Load preference scores for faster lookup
  static async loadPreferenceScores(userId: string): Promise<PreferenceScore[]> {
    try {
      const scoresRef = collection(db, 'preference_scores');
      const q = query(
        scoresRef,
        where('userId', '==', userId),
        orderBy('lastUpdated', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const scores: PreferenceScore[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        scores.push({
          ...data,
          lastUpdated: new Date(data.lastUpdated),
        } as PreferenceScore);
      });
      
      console.log(`[Firestore] Loaded ${scores.length} preference scores for user ${userId}`);
      return scores;
    } catch (error) {
      console.error('Error loading preference scores:', error);
      return [];
    }
  }

  // Get user preference statistics
  static async getUserPreferenceStats(userId: string): Promise<{
    totalInteractions: number;
    likes: number;
    dislikes: number;
    favoriteCategories: string[];
    favoriteColors: string[];
    favoriteBrands: string[];
  }> {
    try {
      const preferences = await this.loadUserPreferences(userId);
      
      const likes = preferences.filter(p => p.preference === 'like').length;
      const dislikes = preferences.filter(p => p.preference === 'dislike').length;
      
      // Get favorite categories
      const categoryCounts = preferences
        .filter(p => p.preference === 'like')
        .reduce((acc, p) => {
          acc[p.category] = (acc[p.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      
      const favoriteCategories = Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category]) => category);
      
      // Get favorite colors
      const colorCounts = preferences
        .filter(p => p.preference === 'like')
        .reduce((acc, p) => {
          acc[p.color] = (acc[p.color] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      
      const favoriteColors = Object.entries(colorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([color]) => color);
      
      // Get favorite brands
      const brandCounts = preferences
        .filter(p => p.preference === 'like')
        .reduce((acc, p) => {
          acc[p.brand] = (acc[p.brand] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      
      const favoriteBrands = Object.entries(brandCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([brand]) => brand);
      
      return {
        totalInteractions: preferences.length,
        likes,
        dislikes,
        favoriteCategories,
        favoriteColors,
        favoriteBrands,
      };
    } catch (error) {
      console.error('Error getting user preference stats:', error);
      return {
        totalInteractions: 0,
        likes: 0,
        dislikes: 0,
        favoriteCategories: [],
        favoriteColors: [],
        favoriteBrands: [],
      };
    }
  }
} 