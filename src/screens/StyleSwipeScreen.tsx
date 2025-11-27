// AI Stylist Screen - Get personalized outfit advice and recommendations
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  Vibration,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { OutfitCombination, OracleService } from '../services/oracleService';
import StyleSwipeCard from '../components/StyleSwipeCard';
import PerfumeRecommendationCard from '../components/PerfumeRecommendationCard';
import * as Location from 'expo-location';
import CountryRoadService from '../services/countryRoadService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useUser } from '../contexts/UserContext';
import { SupabaseService } from '../services/supabaseService';
import PinterestBoardService, { StyleInsight } from '../services/pinterestBoardService';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import PerfumeService, { PerfumeRecommendation } from '../services/perfumeService';
import { WeatherService } from '../services/weatherService';
import GamificationService from '../services/gamificationService';
import ChatbotStylist from '../components/ChatbotStylist';
import ChatbotService, { ChatContext } from '../services/chatbotService';
import * as WardrobeService from '../services/wardrobeService';

type StyleSwipeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StyleSwipe'>;

export default function StyleSwipeScreen() {
  const navigation = useNavigation<StyleSwipeScreenNavigationProp>();
  const { user } = useUser();
  const [outfits, setOutfits] = useState<OutfitCombination[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState<OutfitCombination[]>([]);
  const [streak, setStreak] = useState(0); // Daily streak for engagement
  const [totalSwipes, setTotalSwipes] = useState(0); // Total swipes for gamification
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [occasion, setOccasion] = useState<'casual' | 'professional' | 'date' | 'party'>('casual');
  const [weather, setWeather] = useState<'cold' | 'mild' | 'warm' | 'hot'>('mild');
  const [autoWeather, setAutoWeather] = useState<{ tempC: number; label: typeof weather } | null>(null);
  const [swapModalVisible, setSwapModalVisible] = useState(false);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [swapAlternatives, setSwapAlternatives] = useState<any[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [undoVisible, setUndoVisible] = useState(false);
  const [lastAction, setLastAction] = useState<{ outfit: OutfitCombination; liked: boolean } | null>(null);
  const [pendingLog, setPendingLog] = useState<any | null>(null);
  const [pinterestInsights, setPinterestInsights] = useState<StyleInsight | null>(null);
  const [perfumeRecommendation, setPerfumeRecommendation] = useState<PerfumeRecommendation | null>(null);
  const [gamification, setGamification] = useState<Awaited<ReturnType<typeof GamificationService.getUserGamification>> | null>(null);
  const [chatbotVisible, setChatbotVisible] = useState(false);
  const [chatContext, setChatContext] = useState<ChatContext | null>(null);
  const [wardrobeItems, setWardrobeItems] = useState<any[]>([]);

  useEffect(() => {
    // Initialize streak immediately (no async)
    setStreak(1);
    
    // Set a maximum timeout to ensure loading state is cleared (safety net)
    const maxTimeout = setTimeout(() => {
      console.warn('⚠️ Maximum initialization timeout reached');
      if (loading && outfits.length === 0) {
        setLoading(false);
        // Try to load with fallback
        loadOutfits();
      }
    }, 25000); // 25 second maximum safety net
    
    // Load data in parallel with timeouts - don't block on these
    Promise.allSettled([
      loadPinterestInsights(),
      loadPersistedChips(),
      initWeather(),
      loadWardrobeForChat(),
    ]).then(() => {
      // Load outfits and perfume after other data is ready (or failed)
      // These are independent and won't block each other
      loadOutfits();
      loadPerfumeRecommendation();
      loadGamification();
      buildChatContext();
    });
    
    return () => {
      clearTimeout(maxTimeout);
    };
  }, []);

  const loadGamification = async () => {
    if (!user?.id) return;
    try {
      const data = await GamificationService.getUserGamification(user.id);
      setGamification(data);
      setStreak(data.currentStreak);
    } catch (error) {
      console.error('Error loading gamification:', error);
    }
  };

  const loadWardrobeForChat = async () => {
    if (!user?.id) return;
    try {
      const items = await WardrobeService.getUserWardrobe(user.id);
      setWardrobeItems(items);
    } catch (error) {
      console.error('Error loading wardrobe for chat:', error);
      setWardrobeItems([]);
    }
  };

  const buildChatContext = async () => {
    if (!user?.id) return;
    
    try {
      // Get current weather
      let currentWeather;
      try {
        const location = await Location.getCurrentPositionAsync({});
        currentWeather = await WeatherService.getCurrentWeather(
          location.coords.latitude,
          location.coords.longitude
        );
      } catch {
        currentWeather = autoWeather ? {
          temperature: autoWeather.tempC,
          condition: autoWeather.label,
          feelsLike: autoWeather.tempC,
          season: 'current' as any,
        } : undefined;
      }

      const context: ChatContext = {
        currentWeather,
        wardrobe: wardrobeItems,
        userSchedule: [], // TODO: Add calendar integration
        recentOutfits: favorites.slice(0, 5).map(f => ({
          id: f.id,
          name: f.summary || 'Outfit',
          items: f.items,
        })),
        userPreferences: {
          style: occasion,
          colors: [],
          brands: [],
        },
      };

      setChatContext(context);
    } catch (error) {
      console.error('Error building chat context:', error);
    }
  };

  const loadPerfumeRecommendation = async () => {
    if (!user?.id) return;
    
    try {
      // Get current weather and time
      const hour = new Date().getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 20 ? 'evening' : 'night';
      
      let weatherData;
      try {
        const location = await Location.getCurrentPositionAsync({});
        weatherData = await WeatherService.getCurrentWeather(
          location.coords.latitude,
          location.coords.longitude
        );
      } catch {
        weatherData = { temperature: 20, condition: 'Mild' };
      }

      const recommendation = await PerfumeService.recommendPerfume(user.id, {
        weather: weatherData,
        timeOfDay,
        occasion,
        outfitStyle: occasion,
      });

      setPerfumeRecommendation(recommendation);
    } catch (error) {
      console.error('Error loading perfume recommendation:', error);
      // Silent fail - perfume is optional
    }
  };

  const loadPinterestInsights = async () => {
    if (!user?.id) return;
    
    try {
      // Add timeout for Pinterest loading (5 seconds max)
      const pinterestPromise = PinterestBoardService.getUserBoards(user.id);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Pinterest load timeout')), 5000)
      );
      
      const analyzedBoards = await Promise.race([pinterestPromise, timeoutPromise]);
      
      if (analyzedBoards.length > 0) {
        // Use the most recent board analysis as an enhancement
        const latestAnalysis = analyzedBoards[0];
        setPinterestInsights(latestAnalysis.styleInsights);
        console.log('🎨 Loaded Pinterest insights for enhanced personalization:', latestAnalysis.styleInsights);
        
        // Show subtle notification that Pinterest enhancement is active
        setTimeout(() => {
          // You could add a toast notification here if desired
          console.log('✨ Pinterest style enhancement is now active!');
        }, 1000);
      } else {
        // No Pinterest data - AI stylist works perfectly fine without it
        console.log('💡 No Pinterest data - using standard AI stylist recommendations');
      }
    } catch (error) {
      console.error('Error loading Pinterest insights (optional):', error);
      // Don't show error to user - this is optional
    }
  };

  const loadPersistedChips = async () => {
    try {
      const [savedOccasion, savedWeather] = await Promise.all([
        AsyncStorage.getItem('styleswipe.occasion'),
        AsyncStorage.getItem('styleswipe.weather'),
      ]);
      let didChange = false;
      if (savedOccasion && (['casual','professional','date','party'] as const).includes(savedOccasion as any)) {
        setOccasion(savedOccasion as any);
        didChange = true;
      }
      if (savedWeather && (['cold','mild','warm','hot'] as const).includes(savedWeather as any)) {
        setWeather(savedWeather as any);
        didChange = true;
      }
      if (didChange) {
        await loadOutfits();
      }
    } catch (error) {
      console.error('Error loading persisted preferences:', error);
    }
  };

  const initWeather = async () => {
    try {
      // Use the new getRealTimeWeather method which handles location automatically
      console.log('🌤️ Fetching real-time weather data...');
      const weatherData = await WeatherService.getRealTimeWeather(true); // Force refresh for real-time data
      const tempC = weatherData.temperature;
      const label: typeof weather = tempC <= 12 ? 'cold' : tempC <= 18 ? 'mild' : tempC <= 26 ? 'warm' : 'hot';
      
      console.log(`✅ Real-time weather initialized: ${tempC}°C (${label}) - ${weatherData.condition}`);
      
      setAutoWeather({ tempC, label });
      setWeather(label);
      // Reload outfits with new weather
      await loadOutfits();
    } catch (e) {
      console.error('Error initializing weather:', e);
      // Silent fail; user can still use manual chips
    }
  };

  const handleItemSwapRequest = async (index: number) => {
    try {
      setSwapIndex(index);
      const items = await CountryRoadService.getItems();
      setSwapAlternatives(items.slice(0, 30));
      setSwapModalVisible(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to load alternatives');
    }
  };

  const applySwap = async (altItem: any) => {
    try {
      if (swapIndex === null) return;
      const replacement = CountryRoadService.convertToOutfitItem(altItem);
      const updated = [...outfits];
      const current = { ...updated[currentIndex] } as OutfitCombination;
      const updatedItems = [...current.items];
      updatedItems[swapIndex] = { ...replacement, isFromWardrobe: false } as any;
      current.items = updatedItems;
      updated[currentIndex] = current;
      setOutfits(updated);
      setSwapModalVisible(false);
      setSwapIndex(null);
    } catch (e) {
      setSwapModalVisible(false);
      setSwapIndex(null);
    }
  };

  const loadOutfits = async () => {
    try {
      console.log('Loading outfits...');
      setLoading(true);
      setError(null);

      // Calculate actual temperature to use (from weather service if available, otherwise fallback)
      const tempByWeather: Record<typeof weather, string> = {
        cold: '10°',
        mild: '18°',
        warm: '24°',
        hot: '30°',
      };
      
      // Use actual temperature from weather service if available
      const actualTemp = autoWeather?.tempC 
        ? `${autoWeather.tempC}°` 
        : tempByWeather[weather];
      
      console.log(`🌡️ Using temperature: ${actualTemp} (${autoWeather ? 'from weather service' : 'fallback mapping'})`);

      // Add timeout to prevent hanging (reduced to 10 seconds for faster feedback)
      const outfitPromise = (async () => {

        let generatedOutfits: OutfitCombination[];

        // Use Pinterest insights if available, otherwise use enhanced regular generation
        if (pinterestInsights) {
          console.log('🎨 Using Pinterest insights for enhanced outfit generation');
          generatedOutfits = await OracleService.generateOutfitsWithPinterestInsights(
            pinterestInsights,
            occasion,
            actualTemp,
            10,
            user?.id
          );
        } else {
          console.log('🤖 Using AI stylist with smart recommendations');
          generatedOutfits = await OracleService.generateOutfitCombinations(
            occasion,
            actualTemp,
            10,
            user?.id
          );
        }

        return generatedOutfits;
      })();

      // Race between outfit generation and timeout (10 seconds)
      let generatedOutfits: OutfitCombination[];
      try {
        generatedOutfits = await Promise.race([
          outfitPromise,
          new Promise<OutfitCombination[]>((_, reject) => 
            setTimeout(() => reject(new Error('Outfit generation timeout after 10 seconds')), 10000)
          ),
        ]);
      } catch (timeoutError) {
        // If timeout, try to generate fallback outfits with shorter timeout
        console.warn('⚠️ Outfit generation timed out, using fallback outfits');
        try {
          generatedOutfits = await Promise.race([
            OracleService.generateOutfitCombinations(
              occasion,
              actualTemp,
              5, // Generate fewer outfits as fallback
              user?.id
            ),
            new Promise<OutfitCombination[]>((_, reject) => 
              setTimeout(() => reject(new Error('Fallback timeout')), 5000)
            ),
          ]);
        } catch (fallbackError) {
          // If even fallback fails, use minimal mock outfits
          console.error('⚠️ Fallback outfit generation also failed, using minimal outfits');
          generatedOutfits = await OracleService.getFallbackOutfits(occasion, 3, actualTemp);
        }
      }

      console.log('Generated outfits:', generatedOutfits.length);
      
      if (generatedOutfits.length === 0) {
        // If no outfits, try to use fallback outfits
        console.warn('⚠️ No outfits generated, using fallback outfits');
        const fallbackOutfits = await OracleService.getFallbackOutfits(occasion, 5, actualTemp);
        if (fallbackOutfits.length > 0) {
          setOutfits(fallbackOutfits);
          setCurrentIndex(0);
          setError(null);
          console.log(`✅ Using ${fallbackOutfits.length} fallback outfits`);
        } else {
          setOutfits([]);
          setError('Unable to generate outfits at this time. Please try again or check your connection.');
          console.error('❌ Even fallback outfits failed');
        }
      } else {
        setOutfits(generatedOutfits);
        setCurrentIndex(0);
        setError(null);
        console.log(`✅ Successfully loaded ${generatedOutfits.length} outfits`);
      }
    } catch (error) {
      console.error('Error loading outfits:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Don't show alert for timeout - just set error state
      if (!errorMessage.includes('timeout')) {
        Alert.alert(
          'Error Loading Outfits', 
          `Failed to load outfits: ${errorMessage}\n\nTrying fallback options...`
        );
      }
      
      setError(errorMessage);
      setOutfits([]); // Set empty array so UI can show error state
    } finally {
      setLoading(false);
    }
  };

  const loadMoreOutfits = async () => {
    if (loadingMore) return;
    try {
      setLoadingMore(true);
      
      // Calculate actual temperature for loading more outfits
      const tempByWeather: Record<typeof weather, string> = {
        cold: '10°',
        mild: '18°',
        warm: '24°',
        hot: '30°',
      };
      const actualTemp = autoWeather?.tempC 
        ? `${autoWeather.tempC}°` 
        : tempByWeather[weather];
      
      let more: OutfitCombination[];
      
      // Use Pinterest insights if available, otherwise use enhanced regular generation
      if (pinterestInsights) {
        more = await OracleService.generateOutfitsWithPinterestInsights(
          pinterestInsights,
          occasion,
          actualTemp,
          8,
          user?.id
        );
      } else {
        more = await OracleService.generateOutfitCombinations(
          occasion,
          actualTemp,
          8,
          user?.id
        );
      }
      if (more && more.length) {
        setOutfits(prev => [...prev, ...more]);
      }
    } catch (e) {
      console.error('Error loading more outfits:', e);
    } finally {
      setLoadingMore(false);
    }
  };

  const prefetchOutfitImages = async (outfit?: OutfitCombination) => {
    try {
      if (!outfit || !outfit.items) return;
      const urls = outfit.items
        .map(i => i?.image)
        .filter(Boolean) as string[];
      await Promise.all(urls.map(u => Image.prefetch(u)));
    } catch (error) {
      // Silently fail - image prefetching is non-critical
      console.debug('Image prefetch failed (non-critical):', error);
    }
  };

  useEffect(() => {
    // Prefetch next two outfits' images
    prefetchOutfitImages(outfits[currentIndex + 1]);
    prefetchOutfitImages(outfits[currentIndex + 2]);
    // Trigger background load when near end
    if (outfits.length > 0 && currentIndex >= outfits.length - 3) {
      loadMoreOutfits();
    }
  }, [currentIndex, outfits]);

  const handleSwipeRight = async (outfit: OutfitCombination) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFavorites(prev => [...prev, outfit]);
    setTotalSwipes(prev => prev + 1);

    // Award XP for liking outfit
    if (user?.id) {
      const updated = await GamificationService.awardXP(
        user.id,
        GamificationService.createTransaction('outfit_liked')
      );
      setGamification(updated);
      setStreak(updated.currentStreak);
    }

    // Learn from user preference
    learnFromUserPreference(outfit, true);
    scheduleSwipeLog(outfit, 'like');
    showUndo(outfit, true);
    nextOutfit();
    console.log('Saved outfit:', outfit.id);
  };

  const handleSwipeLeft = async (outfit: OutfitCombination) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTotalSwipes(prev => prev + 1);
    
    // Award XP for swiping (engagement)
    if (user?.id) {
      const updated = await GamificationService.awardXP(
        user.id,
        GamificationService.createTransaction('outfit_swiped')
      );
      setGamification(updated);
      setStreak(updated.currentStreak);
    }
    
    // Learn from user preference
    learnFromUserPreference(outfit, false);
    scheduleSwipeLog(outfit, 'pass');
    showUndo(outfit, false);
    nextOutfit();
    console.log('Passed outfit:', outfit.id);
  };

  const scheduleSwipeLog = (outfit: OutfitCombination, action: 'like' | 'pass') => {
    try { if (!user?.id) return; } catch { return; }
    if (pendingLog) {
      clearTimeout(pendingLog);
      setPendingLog(null);
    }
    const ctx = {
      weather,
      occasion,
      outfitSummary: outfit.summary,
      items: outfit.items?.map(i => ({ category: i.category, color: i.color, brand: i.brand, fromWardrobe: i.isFromWardrobe })) || [],
    };
    const timeoutId = setTimeout(async () => {
      try {
        await SupabaseService.addSwipeHistory({
          userId: user!.id,
          outfitId: outfit.id,
          action: action === 'like' ? 'like' : 'pass',
          timestamp: new Date(),
          context: ctx as any,
        } as any);
      } catch (e) {
        console.log('Failed to log swipe history', e);
      } finally {
        setPendingLog(null);
      }
    }, 1800);
    setPendingLog(timeoutId);
  };

  const showUndo = (outfit: OutfitCombination, liked: boolean) => {
    setLastAction({ outfit, liked });
    setUndoVisible(true);
    // Auto hide in case user ignores
    setTimeout(() => setUndoVisible(false), 2500);
  };

  const undoLastSwipe = () => {
    if (!lastAction) return;
    // Cancel pending log
    if (pendingLog) {
      clearTimeout(pendingLog);
      setPendingLog(null);
    }
    // Revert index back one step if possible
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : 0));
    // Remove from favorites if it was a like
    if (lastAction.liked) {
      setFavorites(prev => prev.filter(o => o.id !== lastAction.outfit.id));
    }
    setTotalSwipes(prev => Math.max(0, prev - 1));
    setUndoVisible(false);
    setLastAction(null);
    Haptics.selectionAsync();
  };

  // Learn from user preferences to improve future recommendations
  const learnFromUserPreference = (outfit: OutfitCombination, liked: boolean) => {
    // Store user preference for learning
    const preference = {
      outfitId: outfit.id,
      liked,
      timestamp: Date.now(),
      occasion: outfit.occasion,
      weather: outfit.weather,
      colorHarmony: outfit.colorHarmony,
      items: outfit.items.map(item => ({
        category: item.category,
        color: item.color,
        brand: item.brand,
        isFromWardrobe: item.isFromWardrobe
      }))
    };
    
    // In production, this would be sent to a learning service
    console.log('Learning from preference:', preference);
  };

  const nextOutfit = () => {
    if (currentIndex < outfits.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Seamless: load more if needed and advance
      if (!loadingMore) {
        loadMoreOutfits();
      }
      // Loop to start
      setCurrentIndex(0);
    }
  };

  const handleOccasionChange = async (opt: typeof occasion) => {
    setOccasion(opt);
    try { 
      await AsyncStorage.setItem('styleswipe.occasion', opt); 
    } catch (error) {
      console.error('Error saving occasion preference:', error);
    }
    loadOutfits();
  };

  const handleWeatherChange = async (opt: typeof weather) => {
    setWeather(opt);
    try { 
      await AsyncStorage.setItem('styleswipe.weather', opt); 
    } catch (error) {
      console.error('Error saving weather preference:', error);
    }
    loadOutfits();
  };

  const currentOutfit = outfits[currentIndex];

  // Show loading screen only if actually loading, not just when outfits array is empty
  if (loading && outfits.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading amazing outfits...</Text>
          <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Show error state if there's an error and no outfits
  if (error && outfits.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.loadingText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setError(null);
              loadOutfits();
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  // If no current outfit but we have outfits, just show first one
  if (!currentOutfit && outfits.length > 0) {
    setCurrentIndex(0);
    return null; // Will re-render with currentOutfit
  }
  
  // If still no outfit after all checks, show loading
  if (!currentOutfit) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Preparing your outfits...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Simplified Header - Clean and focused */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.titleRow}>
            <Ionicons name="sparkles" size={18} color={Colors.primary} />
            <Text style={styles.headerTitle}>AI Stylist</Text>
            {pinterestInsights && (
              <View style={styles.pinterestBadge}>
                <Ionicons name="logo-pinterest" size={10} color="#FFFFFF" />
              </View>
            )}
          </View>
          {pinterestInsights && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {pinterestInsights.aesthetic} style
            </Text>
          )}
        </View>

        {/* Compact stats - only show key metrics */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
            <Ionicons name="heart" size={16} color={Colors.primary} />
            <Text style={styles.statText}>{favorites.length}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
            <Ionicons name="flash" size={16} color={Colors.warning} />
            <Text style={styles.statText}>{gamification?.currentStreak || streak}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.chatButton} 
            onPress={() => {
              if (chatContext) {
                setChatbotVisible(true);
              } else {
                // Build context if not ready
                buildChatContext().then(() => {
                  setChatbotVisible(true);
                });
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubbles" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        {/* Swipe Card */}
        <View style={styles.cardContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading outfits...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadOutfits}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <StyleSwipeCard
                outfit={currentOutfit}
                onSwipeRight={handleSwipeRight}
                onSwipeLeft={handleSwipeLeft}
                isActive={true}
                tweakSuggestion={`Try ${currentOutfit?.colorHarmony?.toLowerCase().includes('neutral') ? 'adding one accent color' : 'grounding with a neutral (black/white/navy)'}`}
                onItemSwapRequest={handleItemSwapRequest}
              />
              {/* Perfume Recommendation */}
              {perfumeRecommendation && (
                <PerfumeRecommendationCard
                  recommendation={perfumeRecommendation}
                  onSwipe={async () => {
                    // Load next perfume recommendation
                    const hour = new Date().getHours();
                    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 20 ? 'evening' : 'night';
                    let weatherData;
                    try {
                      const location = await Location.getCurrentPositionAsync({});
                      weatherData = await WeatherService.getCurrentWeather(
                        location.coords.latitude,
                        location.coords.longitude
                      );
                    } catch {
                      weatherData = { temperature: 20, condition: 'Mild' };
                    }
                    const recommendations = await PerfumeService.getMultipleRecommendations(
                      user?.id || '',
                      {
                        weather: weatherData,
                        timeOfDay,
                        occasion,
                        outfitStyle: occasion,
                      },
                      2
                    );
                    if (recommendations.length > 1) {
                      // Get a different one
                      const currentIndex = recommendations.findIndex(r => r.perfume.id === perfumeRecommendation.perfume.id);
                      const nextIndex = currentIndex === 0 ? 1 : 0;
                      setPerfumeRecommendation(recommendations[nextIndex] || recommendations[0]);
                    }
                  }}
                />
              )}
            </>
          )}
        </View>

        {/* Swipe Instructions - Big, clear, dopamine-inducing */}
        {!loading && !error && outfits.length > 0 && (
          <View style={styles.swipeInstructions}>
            <View style={styles.swipeHint}>
              <TouchableOpacity 
                style={styles.swipeActionButton}
                onPress={() => handleSwipeLeft(currentOutfit)}
                activeOpacity={0.7}
              >
                <View style={[styles.swipeIconContainer, styles.swipeLeftContainer]}>
                  <Ionicons name="close-circle" size={36} color={Colors.error} />
                </View>
                <Text style={[styles.swipeHintText, styles.swipeLeftText]}>Pass</Text>
              </TouchableOpacity>
              
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  {currentIndex + 1} / {outfits.length}
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${((currentIndex + 1) / outfits.length) * 100}%` }
                    ]} 
                  />
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.swipeActionButton}
                onPress={() => handleSwipeRight(currentOutfit)}
                activeOpacity={0.7}
              >
                <View style={[styles.swipeIconContainer, styles.swipeRightContainer]}>
                  <Ionicons name="heart" size={36} color={Colors.primary} />
                </View>
                <Text style={[styles.swipeHintText, styles.swipeRightText]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Swap Modal */}
      <Modal visible={swapModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose a replacement</Text>
            <FlatList
              data={swapAlternatives}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingVertical: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.altItemRow} onPress={() => applySwap(item)}>
                  <Image source={{ uri: item.imageUrl || item.image }} style={styles.altItemImage} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.altItemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.altItemMeta}>{item.brand || 'Country Road'}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setSwapModalVisible(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Undo Banner */}
      {undoVisible && lastAction && (
        <View style={styles.undoBanner}>
          <Text style={styles.undoText}>Swipe {lastAction.liked ? 'saved' : 'dismissed'}</Text>
          <TouchableOpacity onPress={undoLastSwipe} style={styles.undoButton}>
            <Text style={styles.undoButtonText}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Chatbot Modal */}
      <Modal
        visible={chatbotVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setChatbotVisible(false)}
      >
        {chatContext ? (
          <ChatbotStylist
            context={chatContext}
            currentOutfit={currentOutfit}
            onOutfitRefine={(refinement) => {
              console.log('Outfit refinement:', refinement);
            }}
            onClose={() => setChatbotVisible(false)}
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={{ marginTop: 16, color: Colors.text }}>Loading chat context...</Text>
            <TouchableOpacity 
              style={{ marginTop: 20, padding: 12, backgroundColor: Colors.primary, borderRadius: 8 }}
              onPress={() => setChatbotVisible(false)}
            >
              <Text style={{ color: Colors.text, fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  chatCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.backgroundCard,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 10,
  },
  chatCtaText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  pinterestBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.backgroundCard,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 44,
    justifyContent: 'center',
  },
  statText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  chatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  cardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: Colors.text,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  loadingSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  progressText: {
    fontSize: 13,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 6,
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    width: '100%',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  swipeInstructions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundSecondary,
  },
  swipeHint: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
  },
  swipeLeft: {
    alignItems: 'center',
    gap: 6,
  },
  swipeRight: {
    alignItems: 'center',
    gap: 6,
  },
  swipeHintText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  enhancementPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  enhancementText: {
    color: '#E60023',
    fontSize: 11,
    fontWeight: '500',
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  chipGroup: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: Colors.text,
  },
  autoWeatherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 4,
  },
  autoWeatherText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  altItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  altItemImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  altItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  altItemMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  modalClose: {
    alignSelf: 'center',
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  modalCloseText: {
    color: Colors.text,
    fontWeight: '700',
  },
  undoBanner: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.backgroundCard,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  undoText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  undoButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  undoButtonText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
});
