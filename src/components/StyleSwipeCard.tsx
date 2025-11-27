// Style Swipe Card - Tinder-style outfit swiping
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  Vibration,
  ScrollView,
} from 'react-native';
import { PanGestureHandler, State, GestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { OutfitCombination } from '../services/oracleService';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

interface StyleSwipeCardProps {
  outfit: OutfitCombination;
  onSwipeRight: (outfit: OutfitCombination) => void; // Save outfit
  onSwipeLeft: (outfit: OutfitCombination) => void;  // Pass outfit
  isActive: boolean;
  tweakSuggestion?: string;
  onItemSwapRequest?: (index: number) => void;
}

export default function StyleSwipeCard({
  outfit,
  onSwipeRight,
  onSwipeLeft,
  isActive,
  tweakSuggestion,
  onItemSwapRequest,
}: StyleSwipeCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const passScale = useRef(new Animated.Value(0)).current;
  const tweakOverlayOpacity = useRef(new Animated.Value(0)).current;
  const confettiOpacity = useRef(new Animated.Value(0)).current;

  const onGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
          translationY: translateY,
        },
      },
    ],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: GestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.END) {
      const translationX = event.nativeEvent.translationX as number;
      const velocityX = event.nativeEvent.velocityX as number;
      
      // Only handle horizontal swipes
      if (translationX > SWIPE_THRESHOLD || velocityX > 500) {
        // Swipe right - Save outfit
        triggerHeartAnimation();
        Vibration.vibrate(100); // Save haptic
        onSwipeRight(outfit);
      } else if (translationX < -SWIPE_THRESHOLD || velocityX < -500) {
        // Swipe left - Pass
        triggerPassAnimation();
        Vibration.vibrate(50); // Pass haptic
        onSwipeLeft(outfit);
      } else {
        // Return to center
        resetPosition();
      }
    }
  };

  const resetPosition = () => {
    Animated.parallel([
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      Animated.spring(rotate, { toValue: 0, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  const triggerHeartAnimation = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(heartScale, { toValue: 1.2, useNativeDriver: true }),
        Animated.timing(heartOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(heartScale, { toValue: 0, useNativeDriver: true }),
        Animated.timing(heartOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  };


  const triggerPassAnimation = () => {
    Animated.sequence([
      Animated.spring(passScale, { toValue: 1.3, useNativeDriver: true }),
      Animated.spring(passScale, { toValue: 0, useNativeDriver: true }),
    ]).start();
  };

  const triggerTweakAnimation = () => {
    Animated.sequence([
      Animated.timing(tweakOverlayOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(tweakOverlayOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    // Subtle confetti for high projected score
    const baseScore = Math.round((outfit.confidence || 80) / 10);
    const projected = Math.min(10, baseScore + 1);
    if (projected >= 8) {
      Animated.sequence([
        Animated.timing(confettiOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(confettiOpacity, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]).start();
    }
  };

  const rotateInterpolate = translateX.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      <Animated.View
        style={[
          styles.card,
          {
            transform: [
              { translateX },
              { translateY },
              { rotate: rotateInterpolate },
              { scale },
            ],
          },
        ]}
      >
        {/* Score Badge - More prominent */}
        <View style={styles.scoreBadge}>
          <Ionicons name="star" size={14} color={Colors.text} />
          <Text style={styles.scoreText}>{Math.round((outfit.confidence || 80) / 10)}/10</Text>
        </View>
        
        <ScrollView 
          style={styles.cardContentScroll}
          contentContainerStyle={styles.cardContentScrollContainer}
          showsVerticalScrollIndicator={true}
        >
        {/* Outfit Items Display - Bigger images, cleaner layout */}
        <View style={styles.outfitPreview}>
          {outfit.items && outfit.items.length > 0 ? (
            <View style={styles.outfitItemsContainer}>
              {outfit.items.slice(0, 3).map((item, index) => (
                <TouchableOpacity 
                  key={`${item.id}-${index}`} 
                  style={styles.outfitItemCard} 
                  onPress={() => onItemSwapRequest && onItemSwapRequest(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemImageWrapper}>
                    <Image 
                      source={{ uri: item.image }} 
                      style={styles.outfitItemImage}
                      resizeMode="cover"
                    />
                    <View style={styles.itemBadge}>
                      <Ionicons 
                        name={item.isFromWardrobe ? "shirt" : "storefront"} 
                        size={12} 
                        color={Colors.text} 
                      />
                    </View>
                  </View>
                  <Text style={styles.outfitItemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <View style={styles.itemSourceBadge}>
                    <Text style={styles.outfitItemSource}>
                      {item.isFromWardrobe ? 'Yours' : 'Shop'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noItemsContainer}>
              <Ionicons name="shirt" size={80} color={Colors.backgroundSecondary} />
              <Text style={styles.noItemsText}>No items available</Text>
            </View>
          )}
        </View>

        {/* Outfit Info - Clean and focused */}
        <View style={styles.outfitInfo}>
          {/* Confidence score with explanation */}
          <View style={styles.confidenceHeader}>
            <View style={styles.confidenceCircle}>
              <Text style={styles.confidenceNumber}>{outfit.confidence || 85}%</Text>
              <Text style={styles.confidenceLabel}>Match</Text>
            </View>
            <View style={styles.confidenceDetails}>
              <Text style={styles.occasionBadge}>{outfit.occasion || 'Casual'}</Text>
              <Text style={styles.weatherBadge}>{outfit.weather || '22°'}</Text>
            </View>
          </View>

          {/* Confidence explanation */}
          <View style={styles.confidenceExplanation}>
            <Ionicons name="information-circle" size={16} color={Colors.primary} />
            <Text style={styles.confidenceExplanationText}>
              {outfit.confidence >= 90 
                ? `Excellent match! This outfit perfectly aligns with your style, the ${outfit.occasion?.toLowerCase() || 'casual'} occasion, and current weather conditions.`
                : outfit.confidence >= 75
                ? `Great match! This combination works well for ${outfit.occasion?.toLowerCase() || 'casual'} occasions and complements your style preferences.`
                : outfit.confidence >= 60
                ? `Good match! This outfit suits the ${outfit.occasion?.toLowerCase() || 'casual'} occasion and weather, with room to personalize.`
                : `This outfit is suitable for ${outfit.occasion?.toLowerCase() || 'casual'} occasions. Consider adding your personal touch.`}
            </Text>
          </View>

          {/* Summary */}
          <Text style={styles.outfitTitle}>
            {outfit.summary}
          </Text>
          
          {/* Detailed Reasoning - Why this outfit works */}
          {outfit.whyItWorks && outfit.whyItWorks.length > 0 && (
            <View style={styles.reasoningSection}>
              <View style={styles.reasoningHeader}>
                <Ionicons name="sparkles" size={18} color={Colors.primary} />
                <Text style={styles.reasoningTitle}>Why this works for you:</Text>
              </View>
              {outfit.whyItWorks.slice(0, 4).map((reason, index) => (
                <View key={index} style={styles.reasoningItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                  <Text style={styles.reasoningText}>{reason}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        </ScrollView>

        {/* Animated Overlays */}
        <Animated.View
          style={[
            styles.heartOverlay,
            {
              opacity: heartOpacity,
              transform: [{ scale: heartScale }],
            },
          ]}
        >
          <Ionicons name="heart" size={80} color={Colors.primary} />
        </Animated.View>

        <Animated.View
          style={[
            styles.passOverlay,
            {
              opacity: passScale,
              transform: [{ scale: passScale }],
            },
          ]}
        >
          <Ionicons name="close-circle" size={60} color={Colors.error} />
        </Animated.View>

        {/* Projected score overlay */}
        <Animated.View style={[styles.tweakOverlay, { opacity: tweakOverlayOpacity }] }>
          <Ionicons name="trending-up" size={18} color={Colors.text} />
          <Text style={styles.tweakOverlayText}>Projected +1</Text>
        </Animated.View>

        {/* Subtle confetti */}
        <Animated.View style={[styles.confettiContainer, { opacity: confettiOpacity }] }>
          <Ionicons name="sparkles" size={18} color={Colors.primary} />
          <Ionicons name="sparkles" size={16} color={Colors.accent} />
          <Ionicons name="sparkles" size={14} color={Colors.success} />
        </Animated.View>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  card: {
    width: width - 32,
    minHeight: height * 0.75,
    maxHeight: height * 0.85,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
    overflow: 'hidden',
  },
  scoreBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  scoreText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  outfitPreview: {
    height: 180,
    marginBottom: 20,
    marginTop: 50, // Space for score badge
  },
  outfitItemsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    gap: 12,
  },
  outfitItemCard: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    maxWidth: '32%',
    overflow: 'hidden',
  },
  itemImageWrapper: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
    zIndex: 1,
  },
  outfitItemImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 2,
    borderColor: Colors.backgroundCard,
  },
  itemBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.backgroundCard,
    zIndex: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  outfitItemName: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 14,
    minHeight: 28,
  },
  itemSourceBadge: {
    marginTop: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    alignSelf: 'center',
  },
  outfitItemSource: {
    fontSize: 9,
    color: Colors.text,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noItemsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noItemsText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  outfitInfo: {
    marginBottom: 12,
    flex: 1,
    justifyContent: 'flex-start',
  },
  confidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 10,
  },
  confidenceCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.accent,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confidenceNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.text,
  },
  confidenceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
    opacity: 0.9,
  },
  confidenceDetails: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  occasionBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    textTransform: 'capitalize',
  },
  weatherBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confidenceExplanation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  confidenceExplanationText: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },
  outfitTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 4,
  },
  reasoningSection: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  reasoningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  reasoningTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  reasoningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  reasoningText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },
  heartOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -40,
    marginLeft: -40,
    zIndex: 1000,
  },
  passOverlay: {
    position: 'absolute',
    top: '20%',
    right: '10%',
    zIndex: 1000,
  },
  tweakOverlay: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tweakOverlayText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  confettiContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    gap: 6,
  },
  cardContentScroll: {
    flex: 1,
  },
  cardContentScrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
});
