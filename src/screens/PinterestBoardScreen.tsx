import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  StyleSheet,
  Alert,
  Linking,
  Dimensions,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import PinterestService, { PinterestItem, PinterestSearchResult } from '../services/pinterestService';

const { width } = Dimensions.get('window');

export default function PinterestBoardScreen() {
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<PinterestSearchResult | null>(null);
  const [pinterestUrl, setPinterestUrl] = useState('');
  const [favorites, setFavorites] = useState<PinterestItem[]>([]);

  const handlePinterestUrlSubmit = async () => {
    if (!pinterestUrl.trim()) {
      Alert.alert('Error', 'Please enter a Pinterest URL');
      return;
    }

    try {
      setLoading(true);
      console.log('Processing Pinterest URL:', pinterestUrl);
      
      const result = await PinterestService.searchSimilarItems(pinterestUrl.trim());
      setSearchResult(result);
      
    } catch (error) {
      console.error('Error processing Pinterest URL:', error);
      Alert.alert('Error', `Failed to process Pinterest URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleItemPress = (item: PinterestItem) => {
    Alert.alert(
      item.name,
      `$${item.price} • ${item.brand}\n\nSimilarity: ${item.similarity}%`,
      [
        {
          text: 'View in Store',
          onPress: () => Linking.openURL(item.retailerUrl)
        },
        {
          text: 'Find Nearby',
          onPress: () => handleFindNearby(item)
        },
        {
          text: 'Save to Favorites',
          onPress: () => handleSaveToFavorites(item)
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleFindNearby = async (item: PinterestItem) => {
    try {
      const locations = await PinterestService.findNearbyRetailers(item);
      
      const locationText = locations
        .filter(loc => loc.hasItem)
        .map(loc => `${loc.name} - ${loc.distance}km away\n${loc.address}`)
        .join('\n\n');

      Alert.alert(
        `Nearby ${item.brand} Stores`,
        locationText || 'No nearby stores found with this item in stock'
      );
    } catch (error) {
      console.error('Error finding nearby retailers:', error);
      Alert.alert('Error', 'Could not find nearby retailers');
    }
  };

  const handleSaveToFavorites = async (item: PinterestItem) => {
    try {
      const success = await PinterestService.saveFavoriteItem('user123', item);
      if (success) {
        setFavorites(prev => [...prev, item]);
        Alert.alert('Success', 'Item saved to favorites!');
      }
    } catch (error) {
      console.error('Error saving to favorites:', error);
      Alert.alert('Error', 'Could not save to favorites');
    }
  };

  const handleClearSearch = () => {
    setSearchResult(null);
    setPinterestUrl('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Find Similar Items</Text>
        <Text style={styles.subtitle}>
            Paste a Pinterest URL to find similar clothing items from online retailers worldwide
        </Text>
        </View>

        {/* Pinterest URL Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Pinterest URL</Text>
        <TextInput
            style={styles.urlInput}
            placeholder="https://www.pinterest.com/pin/1234567890/"
            value={pinterestUrl}
            onChangeText={setPinterestUrl}
          autoCapitalize="none"
          autoCorrect={false}
            keyboardType="url"
        />
        <TouchableOpacity
            style={[styles.searchButton, loading && styles.searchButtonDisabled]}
            onPress={handlePinterestUrlSubmit}
            disabled={loading}
        >
          {loading ? (
              <ActivityIndicator color={Colors.text} size="small" />
          ) : (
              <>
                <Ionicons name="search" size={20} color={Colors.text} />
                <Text style={styles.searchButtonText}>Find Similar Items</Text>
              </>
          )}
        </TouchableOpacity>
        </View>

        {/* Search Results */}
        {searchResult && (
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                Similar Items Found ({searchResult.similarItems.length})
                            </Text>
              <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
                                    </TouchableOpacity>
            </View>

            {/* Pinterest Image */}
            <View style={styles.pinterestImageContainer}>
              <Text style={styles.pinterestLabel}>Pinterest Image:</Text>
              <Image
                source={{ uri: searchResult.queryImage }}
                style={styles.pinterestImage}
                resizeMode="cover"
              />
            </View>

            {/* Fashion Analysis Display */}
            {searchResult.fashionAnalysis && (
              <View style={styles.analysisContainer}>
                <Text style={styles.analysisTitle}>🎨 Fashion Analysis</Text>
                <View style={styles.analysisGrid}>
                  <View style={styles.analysisItem}>
                    <Text style={styles.analysisLabel}>Clothing Types:</Text>
                    <Text style={styles.analysisValue}>
                      {searchResult.fashionAnalysis.clothingTypes.join(', ') || 'Not detected'}
                    </Text>
                  </View>
                  <View style={styles.analysisItem}>
                    <Text style={styles.analysisLabel}>Colors:</Text>
                    <Text style={styles.analysisValue}>
                      {searchResult.fashionAnalysis.colors.join(', ') || 'Not detected'}
                    </Text>
                  </View>
                  <View style={styles.analysisItem}>
                    <Text style={styles.analysisLabel}>Styles:</Text>
                    <Text style={styles.analysisValue}>
                      {searchResult.fashionAnalysis.styles.join(', ') || 'Not detected'}
                    </Text>
                                  </View>
                  <View style={styles.analysisItem}>
                    <Text style={styles.analysisLabel}>Materials:</Text>
                    <Text style={styles.analysisValue}>
                      {searchResult.fashionAnalysis.materials.join(', ') || 'Not detected'}
                    </Text>
                          </View>
                  <View style={styles.analysisItem}>
                    <Text style={styles.analysisLabel}>Confidence:</Text>
                    <Text style={styles.analysisValue}>
                      {Math.round(searchResult.fashionAnalysis.confidence * 100)}%
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Similar Items Grid */}
            <View style={styles.itemsGrid}>
              {searchResult.similarItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.itemCard}
                  onPress={() => handleItemPress(item)}
                >
                  <Image
                    source={{ uri: item.image }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemBrand}>{item.brand}</Text>
                    <Text style={styles.itemPrice}>${item.price}</Text>
                    <View style={styles.similarityContainer}>
                      <Text style={styles.similarityText}>
                        {item.similarity}% match
                      </Text>
                      <View style={styles.similarityBar}>
                        <View
                          style={[
                            styles.similarityFill,
                            { width: `${item.similarity}%` }
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Search Stats */}
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                Search completed in {searchResult.searchTime}s
              </Text>
            </View>
          </View>
        )}

        {/* Instructions */}
        {!searchResult && (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>How to use:</Text>
            <View style={styles.instructionItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.instructionText}>
                Find a Pinterest post with clothing you like
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.instructionText}>
                Copy the Pinterest URL from your browser
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.instructionText}>
                Paste it above and find similar items from online retailers worldwide
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  urlInput: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    marginTop: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  clearButton: {
    padding: 8,
  },
  pinterestImageContainer: {
    marginBottom: 20,
  },
  pinterestLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  pinterestImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemCard: {
    width: (width - 60) / 2,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: 150,
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  itemBrand: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  similarityContainer: {
    marginTop: 4,
  },
  similarityText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  similarityBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  similarityFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  statsContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  instructionsContainer: {
    marginTop: 40,
    padding: 20,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Fashion Analysis Styles
  analysisContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  analysisGrid: {
    gap: 8,
  },
  analysisItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  analysisLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    flex: 1,
  },
  analysisValue: {
    fontSize: 14,
    color: Colors.text,
    flex: 2,
    textAlign: 'right',
  },
}); 