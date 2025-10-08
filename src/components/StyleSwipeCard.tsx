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
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
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

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      
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
        {/* Score Badge + Confidence Tag */}
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{Math.round((outfit.confidence || 80) / 10)}/10</Text>
        </View>
        <View style={styles.confidenceTag}>
          <Text style={styles.confidenceTagText}>Why this works</Text>
        </View>
        {/* Outfit Items Display */}
        <View style={styles.outfitPreview}>
          {outfit.items && outfit.items.length > 0 ? (
            <View style={styles.outfitItemsGrid}>
              {outfit.items.slice(0, 4).map((item, index) => (
                <TouchableOpacity key={index} style={styles.outfitItemCard} onPress={() => onItemSwapRequest && onItemSwapRequest(index)}>
                  <Image 
                    source={{ uri: item.image }} 
                    style={styles.outfitItemImage}
                  />
                  <Text style={styles.outfitItemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.outfitItemSource}>
                    {item.source === 'wardrobe' ? 'Your Wardrobe' : 'Store Item'}
                  </Text>
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

        {/* Outfit Info */}
        <View style={styles.outfitInfo}>
          <Text style={styles.outfitTitle}>{outfit.summary}</Text>
          <Text style={styles.confidenceText}>
            {outfit.confidence}% confidence • {outfit.occasion}
          </Text>
          
          {/* Simple style explanation */}
          <View style={styles.styleExplanation}>
            <Text style={styles.explanationText}>
              {outfit.colorHarmony && `• ${outfit.colorHarmony} colors`}
              {outfit.weather && `\n• Perfect for ${outfit.weather}`}
              {outfit.occasion && `\n• Great for ${outfit.occasion}`}
            </Text>
          </View>

          {/* One-tap Tweak */}
          {tweakSuggestion ? (
            <TouchableOpacity style={styles.tweakButton} onPress={triggerTweakAnimation}>
              <Ionicons name="sparkles" size={16} color={Colors.text} />
              <Text style={styles.tweakButtonText}>Tweak: {tweakSuggestion}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

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
    height: height * 0.7,
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
  },
  scoreBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 10,
  },
  confidenceTag: {
    position: 'absolute',
    top: 40,
    right: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  confidenceTagText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  scoreText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  outfitPreview: {
    flex: 1,
    marginBottom: 20,
  },
  outfitItemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  outfitItemCard: {
    width: '45%',
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  outfitItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  outfitItemName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 6,
    textAlign: 'center',
  },
  outfitItemSource: {
    fontSize: 10,
    color: Colors.primary,
    marginTop: 2,
    fontWeight: '500',
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
    marginBottom: 16,
  },
  outfitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  confidenceText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  styleExplanation: {
    marginTop: 8,
    padding: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
  explanationText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  tweakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 10,
  },
  tweakButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
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
});
