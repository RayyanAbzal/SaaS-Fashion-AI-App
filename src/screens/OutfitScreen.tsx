import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Outfit, Occasion } from '@/types';

// Mock data for demonstration
const mockOutfits: Outfit[] = [
  {
    id: '1',
    userId: 'user1',
    name: 'Casual Weekend Look',
    description: 'Perfect for brunch or shopping',
    items: [],
    imageUrl: 'https://via.placeholder.com/300x400',
    tags: ['casual', 'weekend', 'comfortable'],
    isFavorite: true,
    season: ['spring', 'summer'],
    occasion: ['casual'],
    wearCount: 8,
    lastWorn: new Date('2024-01-18'),
    createdAt: new Date('2023-12-15'),
    updatedAt: new Date('2024-01-18'),
    confidenceScore: 0.9,
    weatherCompatibility: { temperatureRange: { min: 10, max: 30 }, weatherConditions: ['clear'], seasonality: ['spring', 'summer'] },
    colorHarmony: { scheme: 'monochromatic', score: 0.9, dominantColor: 'blue', styleTips: [] },
    socialStats: { likes: 0, loves: 0, fires: 0, cools: 0, shares: 0, comments: 0, rating: 0, totalRatings: 0 },
    aiGenerated: false,
    quickPick: false,
    outfitType: 'wardrobe-only',
  },
  {
    id: '2',
    userId: 'user1',
    name: 'Business Meeting',
    description: 'Professional and polished',
    items: [],
    imageUrl: 'https://via.placeholder.com/300x400',
    tags: ['business', 'professional', 'formal'],
    isFavorite: false,
    season: ['fall', 'winter'],
    occasion: ['work'],
    wearCount: 3,
    lastWorn: new Date('2024-01-10'),
    createdAt: new Date('2023-11-20'),
    updatedAt: new Date('2024-01-10'),
    confidenceScore: 0.8,
    weatherCompatibility: { temperatureRange: { min: 0, max: 20 }, weatherConditions: ['cloudy'], seasonality: ['fall', 'winter'] },
    colorHarmony: { scheme: 'complementary', score: 0.8, dominantColor: 'gray', styleTips: [] },
    socialStats: { likes: 0, loves: 0, fires: 0, cools: 0, shares: 0, comments: 0, rating: 0, totalRatings: 0 },
    aiGenerated: false,
    quickPick: false,
    outfitType: 'wardrobe-only',
  },
];

const seasons: string[] = ['spring', 'summer', 'fall', 'winter'];
const occasions: Occasion[] = ['work', 'party', 'casual', 'formal', 'date'];

export default function OutfitScreen() {
  const [outfits, setOutfits] = useState<Outfit[]>(mockOutfits);
  const [selectedSeason, setSelectedSeason] = useState<string | 'all'>('all');
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedOutfits, setSelectedOutfits] = useState<Outfit[]>([]);

  const filteredOutfits = outfits.filter(outfit => {
    const matchesSeason = selectedSeason === 'all' || outfit.season.includes(selectedSeason);
    const matchesOccasion = selectedOccasion === 'all' || outfit.occasion.includes(selectedOccasion);
    const matchesSearch = outfit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         outfit.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFavorites = !showFavoritesOnly || outfit.isFavorite;
    return matchesSeason && matchesOccasion && matchesSearch && matchesFavorites;
  });

  const toggleFavorite = (outfitId: string) => {
    setOutfits(prevOutfits =>
      prevOutfits.map(outfit =>
        outfit.id === outfitId ? { ...outfit, isFavorite: !outfit.isFavorite } : outfit
      )
    );
  };

  const handleOutfitLongPress = (item: Outfit) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedOutfits([item]);
    }
  };

  const handleOutfitSelect = (item: Outfit) => {
    if (isSelectionMode) {
      const isSelected = selectedOutfits.some(selected => selected.id === item.id);
      if (isSelected) {
        setSelectedOutfits(selectedOutfits.filter(selected => selected.id !== item.id));
      } else {
        setSelectedOutfits([...selectedOutfits, item]);
      }
    }
  };

  const handleOutfitPress = (item: Outfit) => {
    if (isSelectionMode) {
      handleOutfitSelect(item);
    } else {
      // TODO: Navigate to outfit details or edit
    }
  };

  const handleDeleteSelectedOutfits = () => {
    if (selectedOutfits.length === 0) return;
    setOutfits(outfits.filter(o => !selectedOutfits.some(sel => sel.id === o.id)));
    setSelectedOutfits([]);
    setIsSelectionMode(false);
  };

  const renderFilterButton = (
    title: string,
    isSelected: boolean,
    onPress: () => void
  ) => (
    <TouchableOpacity
      style={[styles.filterButton, isSelected && styles.filterButtonSelected]}
      onPress={onPress}
    >
      <Text style={[styles.filterButtonText, isSelected && styles.filterButtonTextSelected]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderOutfitCard = ({ item }: { item: Outfit }) => {
    const isSelected = selectedOutfits.some(selected => selected.id === item.id);
    return (
      <TouchableOpacity
        style={[styles.outfitCard, isSelectionMode && isSelected && styles.selectedOutfitCard]}
        onPress={() => handleOutfitPress(item)}
        onLongPress={() => handleOutfitLongPress(item)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: item.imageUrl }} style={styles.outfitImage} />
        {isSelectionMode && (
          <View style={[styles.outfitSelectionIndicator, isSelected && styles.outfitSelectionIndicatorSelected]}>
            <Ionicons name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={isSelected ? Colors.primary : Colors.textSecondary} />
          </View>
        )}
        <View style={styles.outfitInfo}>
          <View style={styles.outfitHeader}>
            <Text style={styles.outfitName}>{item.name}</Text>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => toggleFavorite(item.id)}
            >
              <Ionicons
                name={item.isFavorite ? 'heart' : 'heart-outline'}
                size={20}
                color={item.isFavorite ? Colors.error : Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          {item.description && (
            <Text style={styles.outfitDescription}>{item.description}</Text>
          )}
          <View style={styles.outfitDetails}>
            {/* Optionally, you can show confidenceScore or other info here */}
          </View>
          <View style={styles.tagsContainer}>
            {item.season.map(season => (
              <View key={season} style={styles.tag}>
                <Text style={styles.tagText}>{season}</Text>
              </View>
            ))}
            {item.occasion.map(occasion => (
              <View key={occasion} style={[styles.tag, styles.occasionTag]}>
                <Text style={styles.tagText}>{occasion}</Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSelectionModeBar = () => (
    <View style={styles.selectionModeBar}>
      <Text style={styles.selectionModeText}>{selectedOutfits.length} selected</Text>
      <TouchableOpacity style={styles.deleteSelectedButton} onPress={handleDeleteSelectedOutfits}>
        <Ionicons name="trash" size={20} color={Colors.textInverse} />
        <Text style={styles.deleteSelectedText}>Delete Selected</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelSelectionButton} onPress={() => { setIsSelectionMode(false); setSelectedOutfits([]); }}>
        <Ionicons name="close-circle" size={20} color={Colors.textInverse} />
        <Text style={styles.cancelSelectionText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Outfits</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>
      {isSelectionMode && renderSelectionModeBar()}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search outfits..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, showFavoritesOnly && styles.filterButtonActive]}
          onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          <Ionicons
            name={showFavoritesOnly ? 'heart' : 'heart-outline'}
            size={20}
            color={showFavoritesOnly ? Colors.textInverse : Colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Season:</Text>
        <FlatList
          data={['all', ...seasons]}
          renderItem={({ item }) => renderFilterButton(
            item === 'all' ? 'All' : item.charAt(0).toUpperCase() + item.slice(1),
            selectedSeason === item,
            () => setSelectedSeason(item as string | 'all')
          )}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>
      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Occasion:</Text>
        <FlatList
          data={['all', ...occasions]}
          renderItem={({ item }) => renderFilterButton(
            item === 'all' ? 'All' : item.charAt(0).toUpperCase() + item.slice(1),
            selectedOccasion === item,
            () => setSelectedOccasion(item as Occasion | 'all')
          )}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>
      <FlatList
        data={filteredOutfits}
        renderItem={renderOutfitCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.outfitsList}
        showsVerticalScrollIndicator={false}
      />
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
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.text,
  },
  filterButton: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  filtersList: {
    paddingHorizontal: 20,
  },
  filterButtonSelected: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginRight: 12,
  },
  filterButtonTextSelected: {
    color: Colors.textInverse,
  },
  outfitsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  outfitCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  outfitImage: {
    width: '100%',
    height: 200,
  },
  outfitInfo: {
    padding: 16,
  },
  outfitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  outfitName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
  },
  outfitDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  outfitDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginLeft: 4,
  },
  wearCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  occasionTag: {
    backgroundColor: Colors.secondary,
  },
  tagText: {
    fontSize: 12,
    color: Colors.textInverse,
    fontWeight: '500',
  },
  selectedOutfitCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primary + '10',
  },
  outfitSelectionIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  outfitSelectionIndicatorSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '20',
  },
  selectionModeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundCard,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectionModeText: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  deleteSelectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 10,
  },
  deleteSelectedText: {
    color: Colors.textInverse,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  cancelSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.textSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 10,
  },
  cancelSelectionText: {
    color: Colors.textInverse,
    fontWeight: 'bold',
    marginLeft: 6,
  },
}); 