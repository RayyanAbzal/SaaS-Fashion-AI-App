import { NavigatorScreenParams } from '@react-navigation/native';
import { WeatherData } from '@/services/weatherService';
import { VisionAnalysis } from "../services/openaiVisionService";

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  preferences: UserPreferences;
  styleProfile: StyleProfile;
  brandPreferences: BrandPreferences;
  subscription: Subscription;
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
    currency: string;
  };
  preferredRetailers: string[];
  notificationSettings: {
    outfitReminders: boolean;
    styleTips: boolean;
    newArrivals: boolean;
    priceAlerts: boolean;
  };
  privacySettings: {
    shareOutfits: boolean;
    showProfile: boolean;
    allowAnalytics: boolean;
  };
}

export interface StyleProfile {
  personality: 'minimalist' | 'bohemian' | 'classic' | 'edgy' | 'romantic' | 'sporty' | 'elegant' | 'casual';
  bodyType: 'hourglass' | 'rectangle' | 'triangle' | 'inverted-triangle' | 'oval';
  skinTone: 'warm' | 'cool' | 'neutral' | 'olive';
  height: number; // in cm
  weight: number; // in kg
  measurements: {
    bust: number;
    waist: number;
    hips: number;
    inseam: number;
  };
  styleGoals: string[];
  occasions: string[];
  climate: 'tropical' | 'temperate' | 'cold' | 'mixed';
}

export interface BrandPreferences {
  love: string[];
  avoid: string[];
  preferredCategories: Category[];
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  preferredPriceRanges: {
    [brand: string]: { min: number; max: number };
  };
  brandRatings: {
    [brand: string]: number; // 1-5 rating
  };
  lastUpdated: Date;
}

export interface Subscription {
  plan: 'free' | 'premium' | 'pro';
  startDate: Date;
  endDate?: Date;
  features: string[];
  paymentMethod?: PaymentMethod;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple-pay';
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

export type Category = 'tops' | 'bottoms' | 'shoes' | 'accessories' | 'outerwear';

export interface WardrobeItem {
  id: string;
  userId: string;
  name: string;
  category: Category;
  subcategory?: string;
  color: string;
  brand: string;
  size: string;
  imageUrl: string;
  tags: string[];
  isFavorite: boolean;
  wearCount: number;
  lastWorn?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  aiAnalysis?: VisionAnalysis;
  confidenceScore?: number;
  colorAnalysis?: ColorAnalysis;
  weatherCompatibility: WeatherCompatibility;
  purchaseInfo?: PurchaseInfo;
  imageHash?: string;
}

export interface ColorAnalysis {
  primaryColor: string;
  secondaryColors: string[];
  colorFamily: 'warm' | 'cool' | 'neutral';
  seasonality: string[];
  skinToneCompatibility: string[];
}

export interface WeatherCompatibility {
  temperatureRange: { min: number; max: number };
  weatherConditions: string[];
  seasonality: string[];
}

export interface PurchaseInfo {
  price: number;
  currency: string;
  retailer: string;
  purchaseDate: Date;
  warranty?: string;
}

export interface Outfit {
  id: string;
  userId: string;
  name: string;
  description: string;
  items: WardrobeItem[];
  imageUrl?: string;
  shoppingItems?: ShoppingItem[];
  tags: string[];
  isFavorite: boolean;
  season: string[];
  occasion: string[];
  confidenceScore: number;
  weatherCompatibility: WeatherCompatibility;
  colorHarmony: ColorHarmony;
  socialStats: SocialStats;
  wearCount: number;
  lastWorn?: Date;
  createdAt: Date;
  updatedAt: Date;
  aiGenerated: boolean;
  quickPick: boolean;
  outfitType: 'wardrobe-only' | 'mixed' | 'shopping-only';
}

export interface ColorHarmony {
  scheme: 'monochromatic' | 'complementary' | 'analogous' | 'triadic' | 'split-complementary' | 'none';
  score: number;
  dominantColor: string;
  styleTips: string[];
}

export interface SocialStats {
  likes: number;
  loves: number;
  fires: number;
  cools: number;
  shares: number;
  comments: number;
  rating: number;
  totalRatings: number;
}

export interface ItemAvailability {
  inStock: boolean;
  quantity?: number;
  backorder?: boolean;
  estimatedDelivery?: Date;
  storePickup?: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  createdAt: Date;
  sender: 'user' | 'bot';
  context?: MessageContext;
  quickReplies?: QuickReply[];
  outfitSuggestions?: OutfitSuggestion[];
  wardrobeItems?: WardrobeItem[];
}

export interface MessageContext {
  intent: string;
  entities: { [key: string]: any };
}

export interface QuickReply {
  title: string;
  payload: string; // e.g., 'GENERATE_OUTFIT_CASUAL'
}

export interface ChatbotResponse {
  text: string;
  context?: ChatContext;
  quickReplies?: QuickReply[];
  followUp?: string;
}

export interface ChatContext {
  weather?: any;
  occasion?: string;
  wardrobeSubset?: WardrobeItem[];
  lastInteraction?: UserInteraction;
}

export interface UserInteraction {
  timestamp: number;
  action: string; // 'swipe_like', 'swipe_dislike', 'view_item'
  itemId?: string;
}

export interface BotPersonality {
  name: string;
  style: 'friendly' | 'professional' | 'witty';
  voice: string;
}

export interface ConversationFlow {
  [intent: string]: {
    responses: string[];
    actions?: string[];
  };
}

export interface ScheduleEvent {
  id: string;
  title: string;
  date: Date;
  occasion: Occasion;
}

export type Occasion = 'work' | 'party' | 'casual' | 'formal' | 'date';

export interface SwipeHistory {
  id: string;
  userId: string;
  outfitId: string;
  action: 'like' | 'pass' | 'super-like';
  timestamp: Date;
  context: SwipeContext;
  feedback?: SwipeFeedback;
}

export interface SwipeContext {
  weather: WeatherData;
  occasion: string;
  mood: string;
  timeOfDay: string;
  location?: string;
  outfitSignature?: string;
}

export interface SwipeFeedback {
  reason: string;
  rating?: number;
  comments?: string;
  wouldWear: boolean;
  priceAppropriate: boolean;
  styleMatch: boolean;
}

export interface WeatherForecast {
  date: Date;
  temperature: { min: number; max: number };
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

export interface StyleInsights {
  userId: string;
  period: 'week' | 'month' | 'year';
  mostWornItems: WardrobeItem[];
  favoriteColors: string[];
  preferredBrands: string[];
  styleEvolution: StyleEvolutionPoint[];
  recommendations: InsightRecommendation[];
  createdAt: Date;
}

export interface StyleEvolutionPoint {
  date: Date;
  stylePersonality: string;
  confidence: number;
  changes: string[];
}

export interface InsightRecommendation {
  type: 'color' | 'style' | 'brand' | 'occasion';
  title: string;
  description: string;
  confidence: number;
  actionItems: string[];
}

export interface Notification {
  id: string;
  userId: string;
  type: 'outfit-reminder' | 'style-tip' | 'new-arrival' | 'price-alert' | 'achievement';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
  scheduledFor?: Date;
}

export interface Achievement {
  id: string;
  userId: string;
  type: 'streak' | 'style' | 'social' | 'special' | 'wardrobe' | 'category';
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  progress: number;
  maxProgress: number;
  rewards?: AchievementReward[];
}

export interface AchievementReward {
  type: 'badge' | 'points' | 'feature' | 'discount';
  value: string | number;
  description: string;
}

export interface CameraPhoto {
  uri: string;
  width: number;
  height: number;
  base64?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface LoadingState {
  isLoading: boolean;
  error?: ApiError;
  retry?: () => void;
}

export type MainTabParamList = {
  Home: undefined;
  Wardrobe: undefined;
  Outfits: undefined;
  Chat: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  Auth: undefined;
  Login: undefined;
  Camera: undefined;
  BrandSelection: undefined;
  ClothingRecognition: undefined;
  OutfitCreation: { selectedItems: WardrobeItem[] };
  Achievements: undefined;
  StylePreferences: undefined;
  OutfitSwiper: undefined;
  StyleMate: undefined;
  PinterestBoard: undefined;
};

export interface BrandCategory {
  id: string;
  name: string;
  description: string;
  brands: Brand[];
}

export interface Brand {
  id: string;
  name: string;
  logo: string;
  website: string;
  description: string;
  priceRange: 'budget' | 'mid-range' | 'premium' | 'luxury';
  categories: string[];
  sustainability: 'low' | 'medium' | 'high';
  country: string;
  rating: number;
  reviewCount: number;
  isSelected: boolean;
}

export interface OutfitSuggestion {
  id: string;
  items: (WardrobeItem | ShoppingItem)[];
  reasoning: string;
  occasion: string;
  weather: string[];
  confidence: number;
  totalPrice?: number;
  retailerMix?: {
    wardrobeItems: number;
    shoppingItems: number;
    retailers: string[];
  };
  styleNotes?: string[];
  colorHarmony?: ColorHarmony;
}

export interface StyleRecommendation {
  type: 'outfit' | 'item' | 'style-tip';
  title: string;
  description: string;
  confidence: number;
  items?: (WardrobeItem | ShoppingItem)[];
  reasoning: string;
  weatherContext?: WeatherData;
  occasionContext?: string;
}

export interface QuickPickOption {
  id: string;
  outfit: Outfit;
  confidence: number;
  reasoning: string;
  timeToGenerate: number;
}

export interface SwipeAction {
  type: 'like' | 'pass';
  outfitId: string;
  timestamp: Date;
}

export interface OutfitCreationRequest {
  selectedItems: WardrobeItem[];
  occasion: Occasion;
  weather?: WeatherData;
  stylePreferences?: string[];
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  retailerPreferences?: {
    enabled: boolean;
    retailers: string[];
    includeWardrobeOnly: boolean;
  };
  aiPreferences?: {
    considerWeather: boolean;
    considerOccasion: boolean;
    considerStylePreferences: boolean;
    generateMultipleOutfits: boolean;
    maxOutfits: number;
  };
}

export interface OccasionConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  styleGuidelines: string[];
  weatherConsiderations: string[];
  colorPalette: string[];
  formality: 'casual' | 'smart-casual' | 'business' | 'formal' | 'party';
}

export interface OutfitGenerationResult {
  outfits: OutfitSuggestion[];
  analysis: {
    selectedItemsAnalysis: string;
    colorHarmony: ColorHarmony;
    styleCompatibility: number;
    weatherAppropriateness: number;
    occasionFit: number;
  };
  recommendations: {
    missingCategories: Category[];
    suggestedColors: string[];
    styleTips: string[];
  };
}

export interface ColorWheelColor {
  hue: number;
  complementary: string;
  analogous: string[];
  isNeutral?: boolean;
  pairsWithAll?: boolean;
}

export type ColorWheelDefinition = {
  [key: string]: ColorWheelColor;
}; 