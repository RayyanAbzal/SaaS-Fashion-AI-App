import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Outfit, OutfitSuggestion, WardrobeItem } from '../types';
import { getWardrobeItems } from '../services/wardrobeService';
import { StyleService } from '../services/styleService';
import { AuthService } from '../services/authService';
import { FirestoreService } from '../services/firestoreService';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { Extrapolate, interpolate } from 'react-native-reanimated';

interface OutfitSwiperScreenProps {
  navigation: any;
}

const CARD_HEIGHT = 400; // Assuming a default height, as dimensions are removed

// Custom animation for the carousel items
const useCustomAnimation = () => {
  return (value: number) => {
    'worklet';

    const rotate = interpolate(
      value,
      [-1, 0, 1],
      [-10, 0, 10],
      Extrapolate.CLAMP
    );
    const translationX = interpolate(
      value,
      [-1, 0, 1],
      [-300, 0, 300],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      value,
      [-1.5, -1, 0, 1, 1.5],
      [0, 1, 1, 1, 0],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ rotate: `${rotate}deg` }, { translateX: translationX }],
      opacity,
    };
  };
};

const OutfitCard = ({ card, onScroll, onDislike, onLike }: { card: OutfitSuggestion, onScroll: (y: number) => void, onDislike: () => void, onLike: () => void }) => {
  const renderItem = (item: WardrobeItem | any, index: number) => {
    const isWardrobeItem = 'userId' in item;
    const isRetailerItem = !!item.retailer && !isWardrobeItem;
    return (
      <View key={item.id + index} style={styles.verticalItemContainer}>
        <Image source={{ uri: item.imageUrl }} style={styles.verticalItemImage} />
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemBrand}>{item.brand}</Text>
        {item.price && (
          <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
        )}
        {isWardrobeItem ? (
          <View style={styles.itemTagWardrobe}>
            <Text style={styles.itemTagText}>From Your Wardrobe</Text>
          </View>
        ) : isRetailerItem ? (
          <TouchableOpacity
            style={styles.itemTagShopping}
            onPress={() => Linking.openURL(item.productUrl)}
          >
            <Text style={styles.itemTagText}>Shop Now</Text>
          </TouchableOpacity>
        ) : null}
        {item.description && (
          <Text style={styles.itemDescription}>{item.description}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.card, { height: CARD_HEIGHT }]}> 
      <Text style={styles.outfitName}>Outfit Suggestion</Text>
      <ScrollView
        style={styles.itemsScroll}
        contentContainerStyle={[styles.itemsColumn, { flexGrow: 1 }]}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        onScroll={e => onScroll(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        {card.items.map(renderItem)}
        <View style={styles.outfitSummaryContainer}>
          <Text style={styles.outfitSummaryTitle}>Outfit Summary</Text>
          <Text style={styles.outfitReasoning}>{card.reasoning}</Text>
        </View>
      </ScrollView>
      <View style={styles.cardFooterRow}>
        <TouchableOpacity style={styles.dislikeButton} onPress={onDislike}>
          <Text style={styles.dislikeButtonText}>👎</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.likeButton} onPress={onLike}>
          <Text style={styles.likeButtonText}>👍</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const OutfitSwiperScreen: React.FC<OutfitSwiperScreenProps> = ({ navigation }) => {
  const [outfits, setOutfits] = useState<OutfitSuggestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const swipeableRef = useRef<Swipeable>(null);

  const loadOutfits = async () => {
    setLoading(true);
    try {
      const user = await AuthService.getCurrentUser();
      const userId = user?.id;
      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const suggestions = await StyleService.getOutfitSuggestions(userId);
      setOutfits(suggestions);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error loading outfits:', error);
      Alert.alert('Error', 'Failed to load outfit suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOutfits();
  }, []);

  const handleSwipe = async (direction: 'left' | 'right') => {
    const currentOutfit = outfits[currentIndex];
    if (!currentOutfit) return;

    try {
      const user = await AuthService.getCurrentUser();
      const userId = user?.id;
      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Record user interaction for reinforcement learning
      const action = direction === 'right' ? 'like' : 'dislike';
      await StyleService.recordUserInteraction(
        userId,
        currentOutfit.items,
        action,
        'casual'
      );

      // Show feedback based on action
      if (direction === 'right') {
        Alert.alert('Outfit Liked!', 'We\'ll use this feedback to improve your future suggestions.');
      } else {
        Alert.alert('Outfit Disliked', 'We\'ll use this feedback to improve your future suggestions.');
      }

      // Move to next outfit
      if (currentIndex < outfits.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Generate new outfits when we run out
        await loadOutfits();
      }
    } catch (error) {
      console.error('Error recording user interaction:', error);
      Alert.alert('Error', 'Failed to record your preference. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading outfit suggestions...</Text>
      </View>
    );
  }

  if (outfits.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No outfit suggestions available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadOutfits}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.swiperContainer}>
        <Swipeable
          ref={swipeableRef}
          onSwipeableOpen={(direction) => {
            if (direction === 'left') {
              handleSwipe('left');
            } else if (direction === 'right') {
              handleSwipe('right');
            }
          }}
          renderRightActions={() => (
            <View style={styles.swipeAction}>
              <Text style={styles.swipeActionText}>👍</Text>
            </View>
          )}
          renderLeftActions={() => (
            <View style={styles.swipeAction}>
              <Text style={styles.swipeActionText}>👎</Text>
            </View>
          )}
        >
          <OutfitCard 
            card={outfits[currentIndex]} 
            onScroll={() => {}} 
            onDislike={() => handleSwipe('left')} 
            onLike={() => handleSwipe('right')} 
          />
        </Swipeable>
      </View>
      
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {currentIndex + 1} of {outfits.length}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  swiperContainer: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 400,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  confidenceText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  itemsContainer: {
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemName: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  itemColor: {
    fontSize: 14,
    color: Colors.secondary,
  },
  reasoningContainer: {
    marginBottom: 20,
  },
  reasoningTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.text,
  },
  reasoningText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 'auto',
  },
  dislikeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#ff6b6b',
  },
  dislikeButtonText: {
    fontSize: 18,
    color: 'white',
  },
  likeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#51cf66',
  },
  likeButtonText: {
    fontSize: 18,
    color: 'white',
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  swipeActionText: {
    fontSize: 24,
  },
  progressContainer: {
    padding: 20,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Additional styles for OutfitCard component
  verticalItemContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 8,
  },
  verticalItemImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemBrand: {
    fontSize: 14,
    color: Colors.secondary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  itemTagWardrobe: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  itemTagShopping: {
    backgroundColor: '#28a745',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  itemTagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  itemDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  outfitName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  itemsScroll: {
    flex: 1,
  },
  itemsColumn: {
    paddingBottom: 20,
  },
  outfitSummaryContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 8,
  },
  outfitSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  outfitReasoning: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  cardFooterRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 20, },
});

export default OutfitSwiperScreen; 