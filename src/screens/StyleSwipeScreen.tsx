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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { OutfitCombination, OracleService } from '../services/oracleService';
import StyleSwipeCard from '../components/StyleSwipeCard';
import * as Location from 'expo-location';
import CountryRoadService from '../services/countryRoadService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useUser } from '../contexts/UserContext';
import { SupabaseService } from '../services/supabaseService';
import PinterestBoardService, { StyleInsight } from '../services/pinterestBoardService';

export default function StyleSwipeScreen() {
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

  useEffect(() => {
    loadPinterestInsights();
    loadOutfits();
    // Initialize streak (simplified for demo)
    setStreak(1);
    initWeather();
    loadPersistedChips();
  }, []);

  const loadPinterestInsights = async () => {
    if (!user?.id) return;
    
    try {
      // Load user's analyzed Pinterest boards (optional enhancement)
      const analyzedBoards = await PinterestBoardService.getUserBoards(user.id);
      
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
    } catch {}
  };

  const initWeather = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const position = await Location.getCurrentPositionAsync({});
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY;
      if (!apiKey) return;
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
      const resp = await fetch(url);
      const data = await resp.json();
      const tempC = Math.round(data?.main?.temp ?? 20);
      const label: typeof weather = tempC <= 12 ? 'cold' : tempC <= 18 ? 'mild' : tempC <= 26 ? 'warm' : 'hot';
      setAutoWeather({ tempC, label });
      setWeather(label);
      // Reload outfits with new weather
      await loadOutfits();
    } catch (e) {
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

      // Generate outfit combinations using OracleService
      const tempByWeather: Record<typeof weather, string> = {
        cold: '10°',
        mild: '18°',
        warm: '24°',
        hot: '30°',
      };

      let generatedOutfits: OutfitCombination[];

      // Use Pinterest insights if available, otherwise use enhanced regular generation
      if (pinterestInsights) {
        console.log('🎨 Using Pinterest insights for enhanced outfit generation');
        generatedOutfits = await OracleService.generateOutfitsWithPinterestInsights(
          pinterestInsights,
          occasion,
          tempByWeather[weather],
          10,
          user?.id
        );
      } else {
        console.log('🤖 Using AI stylist with smart recommendations');
        generatedOutfits = await OracleService.generateOutfitCombinations(
          occasion,
          tempByWeather[weather],
          10,
          user?.id
        );
      }

      console.log('Generated outfits:', generatedOutfits.length);
      
      if (generatedOutfits.length === 0) {
        throw new Error('No outfits could be generated. Please check if the server is running and try again.');
      }
      
      setOutfits(generatedOutfits);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error loading outfits:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      Alert.alert(
        'Error Loading Outfits', 
        `Failed to load outfits: ${errorMessage}\n\nMake sure the API is deployed and accessible`
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMoreOutfits = async () => {
    if (loadingMore) return;
    try {
      setLoadingMore(true);
      const tempByWeather: Record<typeof weather, string> = {
        cold: '10°',
        mild: '18°',
        warm: '24°',
        hot: '30°',
      };
      let more: OutfitCombination[];
      
      // Use Pinterest insights if available, otherwise use enhanced regular generation
      if (pinterestInsights) {
        more = await OracleService.generateOutfitsWithPinterestInsights(
          pinterestInsights,
          occasion,
          tempByWeather[weather],
          8,
          user?.id
        );
      } else {
        more = await OracleService.generateOutfitCombinations(
          occasion,
          tempByWeather[weather],
          8,
          user?.id
        );
      }
      if (more && more.length) {
        setOutfits(prev => [...prev, ...more]);
      }
    } catch (e) {
      // silent
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
    } catch {}
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

  const handleSwipeRight = (outfit: OutfitCombination) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFavorites(prev => [...prev, outfit]);
    setTotalSwipes(prev => prev + 1);

    // Learn from user preference
    learnFromUserPreference(outfit, true);
    scheduleSwipeLog(outfit, 'like');
    showUndo(outfit, true);
    nextOutfit();
    console.log('Saved outfit:', outfit.id);
  };

  const handleSwipeLeft = (outfit: OutfitCombination) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTotalSwipes(prev => prev + 1);
    
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
    try { await AsyncStorage.setItem('styleswipe.occasion', opt); } catch {}
    loadOutfits();
  };

  const handleWeatherChange = async (opt: typeof weather) => {
    setWeather(opt);
    try { await AsyncStorage.setItem('styleswipe.weather', opt); } catch {}
    loadOutfits();
  };

  const currentOutfit = outfits[currentIndex];

  if (!currentOutfit) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading amazing outfits...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>AI Stylist</Text>
            {pinterestInsights && (
              <View style={styles.pinterestBadge}>
                <Ionicons name="pinterest" size={14} color="#FFFFFF" />
                <Text style={styles.pinterestBadgeText}>Pinterest</Text>
              </View>
            )}
          </View>
          <Text style={styles.headerSubtitle}>
            {pinterestInsights 
              ? `Enhanced with your ${pinterestInsights.aesthetic} Pinterest style` 
              : 'Get personalized outfit advice'
            }
          </Text>
          {!pinterestInsights && (
            <TouchableOpacity 
              style={styles.enhancementPrompt}
              onPress={() => (global as any)?.navigation?.navigate?.('PinterestStyle', {})}
            >
              <Ionicons name="pinterest" size={12} color="#E60023" />
              <Text style={styles.enhancementText}>Enhance with Pinterest</Text>
              <Ionicons name="chevron-forward" size={12} color="#E60023" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => (global as any)?.navigation?.navigate?.('StyleCheck', {})} style={styles.chatCta}>
          <Ionicons name="chatbubble-ellipses" size={18} color={Colors.text} />
          <Text style={styles.chatCtaText}>Ask Stylist</Text>
        </TouchableOpacity>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="heart" size={18} color={Colors.primary} />
            <Text style={styles.statText}>{favorites.length}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="flash" size={18} color={Colors.warning} />
            <Text style={styles.statText}>{streak}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="trending-up" size={18} color={Colors.success} />
            <Text style={styles.statText}>{totalSwipes}</Text>
          </View>
        </View>
      </View>

      {/* Context Chips */}
      <View style={styles.chipsRow}>
        <View style={styles.chipGroup}>
          {(['casual', 'professional', 'date', 'party'] as const).map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, occasion === opt && styles.chipSelected]}
              onPress={() => handleOccasionChange(opt)}
            >
              <Text style={[styles.chipText, occasion === opt && styles.chipTextSelected]}>
                {opt === 'professional' ? 'work' : opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.chipGroup}>
          {autoWeather ? (
            <View style={styles.autoWeatherPill}>
              <Ionicons name="thermometer" size={14} color={Colors.text} />
              <Text style={styles.autoWeatherText}>{autoWeather.tempC}°C</Text>
            </View>
          ) : null}
          {(['cold', 'mild', 'warm', 'hot'] as const).map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, weather === opt && styles.chipSelected]}
              onPress={() => handleWeatherChange(opt)}
            >
              <Text style={[styles.chipText, weather === opt && styles.chipTextSelected]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
          <StyleSwipeCard
            outfit={currentOutfit}
            onSwipeRight={handleSwipeRight}
            onSwipeLeft={handleSwipeLeft}
            isActive={true}
            tweakSuggestion={`Try ${currentOutfit?.colorHarmony?.toLowerCase().includes('neutral') ? 'adding one accent color' : 'grounding with a neutral (black/white/navy)'}`}
            onItemSwapRequest={handleItemSwapRequest}
          />
        )}
      </View>

      {/* Progress Indicator */}
      {!loading && !error && outfits.length > 0 && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentIndex + 1} of {outfits.length}
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
      )}

      {/* Swipe Instructions */}
      {!loading && !error && outfits.length > 0 && (
        <View style={styles.swipeInstructions}>
          <View style={styles.swipeInstruction}>
            <Ionicons name="close-circle" size={24} color={Colors.error} />
            <Text style={styles.swipeInstructionText}>Swipe Left to Pass</Text>
          </View>
          <View style={styles.swipeInstruction}>
            <Ionicons name="heart" size={24} color={Colors.primary} />
            <Text style={styles.swipeInstructionText}>Swipe Right to Save</Text>
          </View>
        </View>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: Colors.background,
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
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.backgroundCard,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  swipeInstructions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: Colors.background,
  },
  swipeInstruction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swipeInstructionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pinterestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E60023',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pinterestBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
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
