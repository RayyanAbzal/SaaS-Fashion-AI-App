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
            const items = snapshot.docs.map(doc => {
              const data = doc.data();
              return { 
                id: doc.id, 
                ...data 
              } as WardrobeItem;
            }).filter(item => item && item.id); // Filter out any malformed items
            
            onUpdate(items);
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
    await setDoc(doc(db, 'users', item.userId, 'wardrobe', item.id), item);
  }

  static async updateWardrobeItem(item: WardrobeItem): Promise<void> {
    const itemRef = doc(db, 'users', item.userId, 'wardrobe', item.id);
    await updateDoc(itemRef, { ...item, updatedAt: new Date() });
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
      return itemSnapshot.docs.map(doc => doc.data() as WardrobeItem);
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
      
      // Remove orderBy to avoid index requirement - we'll sort in memory instead
      const q = query(
        collection(db, 'swipe_history'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as SwipeHistory[];
      
      // Sort by timestamp in memory instead
      return results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
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
      const items = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as WardrobeItem[];
      callback(items);
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
      const items = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as WardrobeItem[];

      // Filter by search term in memory for better performance
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return items.filter(item =>
          item.name.toLowerCase().includes(term) ||
          item.brand.toLowerCase().includes(term) ||
          item.tags.some(tag => tag.toLowerCase().includes(term))
        );
      }

      return items;
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
} 