// Simplified Outfit Swiper - Uses StyleSwipeCard for consistency
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OutfitCombination, OracleService } from '../services/oracleService';
import { OutfitGenerator } from '../services/outfitGenerator';
import StyleSwipeCard from './StyleSwipeCard';
import { Colors } from '../constants/colors';

const { height } = Dimensions.get('window');

interface OutfitSwiperProps {
  initialOutfit?: OutfitCombination;
  onWearOutfit: (outfit: OutfitCombination) => void;
  onClose: () => void;
  userId?: string;
}

export default function OutfitSwiper({
  initialOutfit,
  onWearOutfit,
  onClose,
  userId,
}: OutfitSwiperProps) {
  const [outfits, setOutfits] = useState<OutfitCombination[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    generateOutfitOptions();
  }, []);

  const generateOutfitOptions = async () => {
    try {
      const wardrobeItems = await OracleService.getRealWardrobeItems(userId);
      const retailerItems = OracleService.getRetailerItems();
      const allItems = [...wardrobeItems, ...retailerItems];
      
      if (allItems.length === 0) {
        Alert.alert('No Items', 'Add items to your wardrobe to generate outfits!');
        return;
      }
      
      const outfitOptions = OutfitGenerator.generateOutfitCombinations(allItems, 'casual', '22°', 5);
      setOutfits(outfitOptions);
    } catch (error) {
      console.error('Error generating outfit options:', error);
      Alert.alert('Error', 'Failed to generate outfits. Please try again.');
    }
  };

  const handleSwipeRight = (outfit: OutfitCombination) => {
    console.log('Loved outfit:', outfit.id);
    nextOutfit();
  };

  const handleSwipeLeft = (outfit: OutfitCombination) => {
    console.log('Passed outfit:', outfit.id);
    nextOutfit();
  };

  const handleSwipeUp = (outfit: OutfitCombination) => {
    onWearOutfit(outfit);
    Alert.alert('Wear Today!', 'Outfit added to your calendar!');
    nextOutfit();
  };

  const handleSwipeDown = (outfit: OutfitCombination) => {
    Alert.alert('Show Variations', 'This would show different styling options.');
    console.log('Show variations for:', outfit.id);
  };

  const nextOutfit = () => {
    if (currentIndex < outfits.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      Alert.alert('All Done!', 'You\'ve seen all outfits. Generating more...');
      generateOutfitOptions();
      setCurrentIndex(0);
    }
  };

  const currentOutfit = outfits[currentIndex];

  if (!currentOutfit) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="refresh" size={40} color={Colors.primary} />
          <Text style={styles.loadingText}>Loading amazing outfits...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Style Oracle</Text>
        <Text style={styles.progressText}>
          {currentIndex + 1} of {outfits.length}
        </Text>
      </View>

      {/* Swipe Card */}
      <View style={styles.cardContainer}>
        <StyleSwipeCard
          outfit={currentOutfit}
          onSwipeRight={handleSwipeRight}
          onSwipeLeft={handleSwipeLeft}
          onSwipeUp={handleSwipeUp}
          onSwipeDown={handleSwipeDown}
          isActive={true}
        />
      </View>
    </View>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  progressText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 16,
  },
});