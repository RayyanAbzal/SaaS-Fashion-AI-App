import React, { useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { OutfitCombination } from '../services/oracleService';
import TwoDAvatarPreview from './TwoDAvatarPreview';

const { width, height } = Dimensions.get('window');

interface SwipeableOutfitCardProps {
  outfit: OutfitCombination;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
  onWearThis: () => void;
  onTryAnother: () => void;
  isActive: boolean;
}

export default function SwipeableOutfitCard({
  outfit,
  onSwipeUp,
  onSwipeDown,
  onWearThis,
  onTryAnother,
  isActive,
}: SwipeableOutfitCardProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;


  const renderOutfitItem = (item: any, index: number) => {
    // Safety check for item properties
    if (!item || !item.image) {
      console.warn('Invalid item in outfit:', item);
      return null;
    }
    
    return (
      <View key={item.id || index} style={styles.outfitItem}>
        <View style={styles.outfitItemImageContainer}>
          <Image source={{ uri: item.image }} style={styles.outfitItemImage} />
          <View style={styles.outfitItemBadge}>
            <Ionicons
              name={item.isFromWardrobe ? 'shirt' : 'storefront'}
              size={12}
              color={Colors.text}
            />
          </View>
        </View>
        <Text style={styles.outfitItemName} numberOfLines={1}>
          {item.name || 'Unknown Item'}
        </Text>
      </View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [
            { translateY },
            { scale: isActive ? scale : new Animated.Value(0.95) }
          ],
          opacity: isActive ? 1 : 0.7,
        },
      ]}
    >
        {/* Swipe Instructions */}
        <View style={styles.swipeInstructions}>
          <Ionicons name="swap-vertical" size={20} color={Colors.textSecondary} />
          <Text style={styles.swipeText}>Swipe for more outfits</Text>
        </View>

        {/* Oracle Header */}
        <View style={styles.oracleHeader}>
          <View style={styles.oracleIcon}>
            <Ionicons name="sparkles" size={24} color="#FFD700" />
          </View>
          <View style={styles.oracleInfo}>
            <Text style={styles.oracleTitle}>🔮 Oracle's Wisdom</Text>
            <Text style={styles.confidence}>
              {outfit.confidence}% confidence • {outfit.occasion}
            </Text>
          </View>
        </View>

          {/* 2D Avatar Preview */}
          {outfit.items && outfit.items.length > 0 ? (
            <TwoDAvatarPreview
              items={outfit.items}
              onItemPress={(item) => {
                // TODO: Add item detail modal
                console.log('Item clicked:', item.name);
              }}
              showFitPrediction={true}
            />
          ) : (
            <View style={styles.noItemsContainer}>
              <Text style={styles.noItemsText}>No items available</Text>
            </View>
          )}


        {/* Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Style Analysis</Text>
          <Text style={styles.summaryText}>{outfit.summary}</Text>
          
          {/* Color Harmony */}
          <View style={styles.colorHarmony}>
            <Text style={styles.colorHarmonyText}>{outfit.colorHarmony}</Text>
          </View>

          {/* Style Notes */}
          <View style={styles.styleNotes}>
            <Text style={styles.styleNotesTitle}>Style Notes:</Text>
            {outfit.styleNotes?.map((note, index) => (
              <View key={index} style={styles.noteItem}>
                <Text style={styles.noteText}>• {note}</Text>
              </View>
            ))}
          </View>

          {/* Fit Advice */}
          <View style={styles.fitAdvice}>
            <Text style={styles.fitAdviceText}>{outfit.fitAdvice}</Text>
          </View>
        </View>

      </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: width - 40,
    height: height * 0.8,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  swipeInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingVertical: 10,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
  },
  swipeText: {
    marginLeft: 8,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  oracleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  oracleIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  oracleInfo: {
    flex: 1,
  },
  oracleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  confidence: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  outfitItemsDisplay: {
    marginVertical: 20,
    gap: 12,
  },
  outfitItemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 12,
  },
  outfitItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  outfitItemInfo: {
    flex: 1,
  },
  outfitItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  outfitItemCategory: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  outfitItemBrand: {
    fontSize: 12,
    color: Colors.primary,
    marginBottom: 2,
  },
  outfitItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },
  noItemsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noItemsText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  outfitItemsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  outfitItem: {
    alignItems: 'center',
    width: 60,
  },
  outfitItemImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  outfitItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  outfitItemBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outfitItemName: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  noItemsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  summaryContainer: {
    flex: 1,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  colorHarmony: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
  colorHarmonyText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  styleNotes: {
    marginBottom: 12,
  },
  styleNotesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 6,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
  fitAdvice: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
  fitAdviceText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 6,
    flex: 1,
    fontStyle: 'italic',
  },
});
