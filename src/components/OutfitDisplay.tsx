import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

interface OutfitItem {
  id: string;
  name: string;
  image: string;
  category: string;
  color: string;
  brand?: string;
  price?: string;
  isFromWardrobe: boolean;
}

interface OutfitCombination {
  id: string;
  items: OutfitItem[];
  summary: string;
  confidence: number;
  occasion: string;
  weather: string;
  whyItWorks: string[];
}

interface OutfitDisplayProps {
  outfit: OutfitCombination;
  onWearThis: () => void;
  onTryAnother: () => void;
  onViewDetails: (item: OutfitItem) => void;
}

export default function OutfitDisplay({
  outfit,
  onWearThis,
  onTryAnother,
  onViewDetails,
}: OutfitDisplayProps) {
  const renderOutfitItem = (item: OutfitItem, index: number) => (
    <TouchableOpacity
      key={item.id}
      style={styles.itemContainer}
      onPress={() => onViewDetails(item)}
    >
      <View style={styles.itemImageContainer}>
        <Image source={{ uri: item.image }} style={styles.itemImage} />
        <View style={styles.itemBadge}>
          <Ionicons
            name={item.isFromWardrobe ? 'shirt' : 'storefront'}
            size={12}
            color={Colors.text}
          />
        </View>
      </View>
      <Text style={styles.itemName} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.itemDetails}>
        {item.color} • {item.category}
      </Text>
      {item.brand && (
        <Text style={styles.itemBrand}>{item.brand}</Text>
      )}
      {item.price && (
        <Text style={styles.itemPrice}>{item.price}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.oracleIcon}>
          <Ionicons name="sparkles" size={24} color="#FFD700" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.oracleTitle}>🔮 Oracle's Wisdom</Text>
          <Text style={styles.confidence}>
            {outfit.confidence}% confidence • {outfit.occasion}
          </Text>
        </View>
      </View>

      {/* Outfit Items Grid */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.itemsScroll}
        contentContainerStyle={styles.itemsContainer}
      >
        {outfit.items.map((item, index) => renderOutfitItem(item, index))}
      </ScrollView>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Why This Works:</Text>
        <Text style={styles.summaryText}>{outfit.summary}</Text>
        
        <View style={styles.whyItWorksContainer}>
          {outfit.whyItWorks.map((reason, index) => (
            <View key={index} style={styles.whyItWorksItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
              <Text style={styles.whyItWorksText}>{reason}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.tryAnotherButton} onPress={onTryAnother}>
          <Ionicons name="refresh" size={20} color={Colors.textSecondary} />
          <Text style={styles.tryAnotherText}>Ask Again</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.wearThisButton} onPress={onWearThis}>
          <Ionicons name="checkmark" size={20} color={Colors.text} />
          <Text style={styles.wearThisText}>Wear This</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  oracleIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerText: {
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
  itemsScroll: {
    marginBottom: 20,
  },
  itemsContainer: {
    paddingHorizontal: 20,
  },
  itemContainer: {
    width: 120,
    marginRight: 15,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  itemImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  itemBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  itemBrand: {
    fontSize: 10,
    color: Colors.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 10,
    color: Colors.accent,
    textAlign: 'center',
    fontWeight: '600',
  },
  summaryContainer: {
    paddingHorizontal: 20,
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
    marginBottom: 15,
  },
  whyItWorksContainer: {
    gap: 8,
  },
  whyItWorksItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  whyItWorksText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 15,
  },
  tryAnotherButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    gap: 8,
  },
  tryAnotherText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  wearThisButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    gap: 8,
  },
  wearThisText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
});
