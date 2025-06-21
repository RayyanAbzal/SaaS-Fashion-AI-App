export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  stylePreferences: string[];
  favoriteColors: string[];
  sizePreferences: {
    top: string;
    bottom: string;
    shoes: string;
  };
  budget: {
    min: number;
    max: number;
  };
}

export interface WardrobeItem {
  id: string;
  userId: string;
  name: string;
  category: ItemCategory;
  subcategory: string;
  color: string;
  brand?: string;
  size?: string;
  imageUrl: string;
  tags: string[];
  isFavorite: boolean;
  wearCount: number;
  lastWorn?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ItemCategory = 
  | 'tops'
  | 'bottoms'
  | 'dresses'
  | 'outerwear'
  | 'shoes'
  | 'accessories'
  | 'jewelry'
  | 'bags';

export interface Outfit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  items: WardrobeItem[];
  imageUrl?: string;
  tags: string[];
  isFavorite: boolean;
  season: Season[];
  occasion: Occasion[];
  rating?: number;
  wearCount: number;
  lastWorn?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type Occasion = 'casual' | 'business' | 'formal' | 'sport' | 'party' | 'date';

export interface CameraPhoto {
  uri: string;
  width: number;
  height: number;
  base64?: string;
}

export interface NavigationProps {
  navigation: any;
  route: any;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface AppState {
  auth: AuthState;
  wardrobe: WardrobeState;
  outfits: OutfitsState;
}

export interface WardrobeState {
  items: WardrobeItem[];
  isLoading: boolean;
  error: string | null;
  filters: WardrobeFilters;
}

export interface WardrobeFilters {
  category?: ItemCategory;
  color?: string;
  brand?: string;
  isFavorite?: boolean;
  searchQuery?: string;
}

export interface OutfitsState {
  outfits: Outfit[];
  isLoading: boolean;
  error: string | null;
  filters: OutfitFilters;
}

export interface OutfitFilters {
  season?: Season;
  occasion?: Occasion;
  isFavorite?: boolean;
  searchQuery?: string;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
} 