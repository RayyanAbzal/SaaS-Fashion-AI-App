import { collection, getDocs, query, where, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { WardrobeItem } from '../types';

export async function getUserWardrobe(userId: string): Promise<WardrobeItem[]> {
  const q = query(collection(db, 'wardrobe'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as WardrobeItem));
}

export async function addWardrobeItem(item: Omit<WardrobeItem, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'wardrobe'), item);
  return docRef.id;
}

export async function updateWardrobeItem(item: WardrobeItem): Promise<void> {
  const { id, ...itemData } = item;
  const docRef = doc(db, 'wardrobe', id);
  await updateDoc(docRef, itemData);
}

export async function deleteWardrobeItem(itemId: string): Promise<void> {
  const docRef = doc(db, 'wardrobe', itemId);
  await deleteDoc(docRef);
}

export async function getWardrobeItems(): Promise<WardrobeItem[]> {
  // For now, return mock data - in production this would fetch from Firestore
  return [
    {
      id: '1',
      userId: 'user1',
      name: 'Blue Denim Jacket',
      category: 'outerwear',
      subcategory: 'jacket',
      color: 'blue',
      brand: 'Levi\'s',
      size: 'M',
      imageUrl: 'https://via.placeholder.com/150',
      tags: ['casual', 'denim', 'jacket'],
      isFavorite: false,
      wearCount: 5,
      lastWorn: new Date('2024-01-15'),
      createdAt: new Date('2023-12-01'),
      updatedAt: new Date('2024-01-15'),
      confidenceScore: 85,
      colorAnalysis: {
        primaryColor: '#1E40AF',
        secondaryColors: ['#3B82F6', '#60A5FA'],
        colorFamily: 'cool',
        seasonality: ['fall', 'winter'],
        skinToneCompatibility: ['warm', 'cool'],
      },
      weatherCompatibility: {
        temperatureRange: { min: 5, max: 20 },
        weatherConditions: ['cloudy', 'rainy', 'windy'],
        seasonality: ['fall', 'winter'],
      },
    },
    {
      id: '2',
      userId: 'user1',
      name: 'White T-Shirt',
      category: 'tops',
      subcategory: 't-shirt',
      color: 'white',
      brand: 'H&M',
      size: 'L',
      imageUrl: 'https://via.placeholder.com/150',
      tags: ['casual', 'basic', 't-shirt'],
      isFavorite: true,
      wearCount: 12,
      lastWorn: new Date('2024-01-20'),
      createdAt: new Date('2023-11-15'),
      updatedAt: new Date('2024-01-20'),
      confidenceScore: 92,
      colorAnalysis: {
        primaryColor: '#FFFFFF',
        secondaryColors: ['#F3F4F6', '#E5E7EB'],
        colorFamily: 'neutral',
        seasonality: ['spring', 'summer', 'fall', 'winter'],
        skinToneCompatibility: ['warm', 'cool'],
      },
      weatherCompatibility: {
        temperatureRange: { min: 15, max: 30 },
        weatherConditions: ['sunny', 'partly-cloudy', 'cloudy'],
        seasonality: ['spring', 'summer', 'fall'],
      },
    },
  ];
} 