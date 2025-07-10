import { collection, getDocs, query, where, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
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
  // Fetch from Firestore instead of returning mock data
  const itemsCol = collection(db, 'wardrobe');
  const itemSnapshot = await getDocs(query(itemsCol, orderBy('createdAt', 'desc')));
  const items = itemSnapshot.docs.map(doc => Object.assign({}, doc.data(), { id: doc.id }));
  // Filter for required fields and then cast to WardrobeItem[]
  const validItems = items.filter(item => item.id && item.name && item.category && item.brand && item.color && item.imageUrl && item.userId).map(item => item as WardrobeItem);
  return validItems;
} 