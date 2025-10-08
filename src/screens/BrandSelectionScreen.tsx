import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Brand, BrandCategory } from '../types';
import { AuthService } from '../services/authService';

interface BrandSelectionScreenProps {
  navigation: any;
}

export default function BrandSelectionScreen({ navigation }: BrandSelectionScreenProps) {
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New Zealand brand categories
  const brandCategories: BrandCategory[] = [
    {
      id: '1',
      name: 'Major Retailers',
      description: 'Popular New Zealand fashion retailers',
      brands: [
        {
          id: 'hallensteins',
          name: 'Hallensteins',
          logo: 'https://via.placeholder.com/100x50/1E40AF/FFFFFF?text=Hallensteins',
          website: 'https://www.hallensteins.com',
          description: 'Casual and streetwear for men and women',
          priceRange: 'mid-range',
          categories: ['casual', 'streetwear', 'basics'],
          sustainability: 'medium',
          country: 'New Zealand',
          rating: 4.2,
          reviewCount: 1250,
          isSelected: false,
        },
        {
          id: 'glassons',
          name: 'Glassons',
          logo: 'https://via.placeholder.com/100x50/8B5CF6/FFFFFF?text=Glassons',
          website: 'https://www.glassons.com',
          description: 'Trendy fashion for young adults',
          priceRange: 'budget',
          categories: ['trendy', 'casual', 'young-adult'],
          sustainability: 'low',
          country: 'New Zealand',
          rating: 3.8,
          reviewCount: 890,
          isSelected: false,
        },
        {
          id: 'country-road',
          name: 'Country Road',
          logo: 'https://via.placeholder.com/100x50/F59E0B/FFFFFF?text=Country+Road',
          website: 'https://www.countryroad.co.nz/',
          description: 'Premium lifestyle brand for woman, man, teen, child & home.',
          priceRange: 'premium',
          categories: ['woman', 'man', 'teen', 'child', 'home', 'lifestyle', 'premium'],
          sustainability: 'high',
          country: 'Australia',
          rating: 4.5,
          reviewCount: 2100,
          isSelected: false,
        },
      ],
    },
    {
      id: '2',
      name: 'Outdoor & Active',
      description: 'Outdoor and activewear brands',
      brands: [
        {
          id: 'kathmandu',
          name: 'Kathmandu',
          logo: 'https://via.placeholder.com/100x50/EF4444/FFFFFF?text=Kathmandu',
          website: 'https://www.kathmandu.co.nz',
          description: 'Outdoor gear and adventure wear',
          priceRange: 'mid-range',
          categories: ['outdoor', 'adventure', 'technical'],
          sustainability: 'high',
          country: 'New Zealand',
          rating: 4.3,
          reviewCount: 1560,
          isSelected: false,
        },
        {
          id: 'icebreaker',
          name: 'Icebreaker',
          logo: 'https://via.placeholder.com/100x50/06B6D4/FFFFFF?text=Icebreaker',
          website: 'https://www.icebreaker.com',
          description: 'Merino wool outdoor clothing',
          priceRange: 'premium',
          categories: ['outdoor', 'merino', 'sustainable'],
          sustainability: 'high',
          country: 'New Zealand',
          rating: 4.7,
          reviewCount: 980,
          isSelected: false,
        },
      ],
    },
  ];

  useEffect(() => {
    loadUserBrandPreferences();
  }, []);

  const loadUserBrandPreferences = async () => {
    try {
      const user = await AuthService.getCurrentUser();
      if (user?.brandPreferences?.love) {
        setSelectedBrands(user.brandPreferences.love);
      }
    } catch (error) {
      console.error('Error loading brand preferences:', error);
    }
  };

  const toggleBrand = (brandId: string) => {
    setSelectedBrands(prev => {
      if (prev.includes(brandId)) {
        return prev.filter(id => id !== brandId);
      } else {
        return [...prev, brandId];
      }
    });
  };

  const savePreferences = async () => {
    setIsLoading(true);
    try {
      const user = await AuthService.getCurrentUser();
      if (user) {
        await AuthService.updateBrandPreferences(user.id, {
          love: selectedBrands,
          avoid: [],
          preferredCategories: [],
          budget: { min: 0, max: 1000, currency: 'USD' },
          preferredPriceRanges: {},
          brandRatings: {},
        });
        Alert.alert('Success', 'Brand preferences saved!');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error saving brand preferences:', error);
      Alert.alert('Error', 'Failed to save preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriceRangeColor = (priceRange: string) => {
    switch (priceRange) {
      case 'budget': return Colors.success;
      case 'mid-range': return Colors.warning;
      case 'premium': return Colors.error;
      case 'luxury': return Colors.accent;
      default: return Colors.textSecondary;
    }
  };

  const getSustainabilityColor = (sustainability: string) => {
    switch (sustainability) {
      case 'high': return Colors.success;
      case 'medium': return Colors.warning;
      case 'low': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Your Brands</Text>
        <TouchableOpacity
          style={[styles.saveButton, selectedBrands.length === 0 && styles.saveButtonDisabled]}
          onPress={savePreferences}
          disabled={selectedBrands.length === 0 || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.text} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Description */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionText}>
          Choose your favorite brands to get personalized outfit suggestions. 
          StyleMate will use these brands when creating outfit combinations.
        </Text>
        <Text style={styles.selectedCount}>
          {selectedBrands.length} brand{selectedBrands.length !== 1 ? 's' : ''} selected
        </Text>
      </View>

      {/* Brand Categories */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {brandCategories.map(category => (
          <View key={category.id} style={styles.categoryContainer}>
            <Text style={styles.categoryTitle}>{category.name}</Text>
            <Text style={styles.categoryDescription}>{category.description}</Text>
            
            <View style={styles.brandsContainer}>
              {category.brands.map(brand => (
                <TouchableOpacity
                  key={brand.id}
                  style={[
                    styles.brandCard,
                    selectedBrands.includes(brand.id) && styles.brandCardSelected
                  ]}
                  onPress={() => toggleBrand(brand.id)}
                >
                  <View style={styles.brandHeader}>
                    <Image
                      source={{ uri: brand.logo }}
                      style={styles.brandLogo}
                      resizeMode="contain"
                    />
                    <View style={styles.brandInfo}>
                      <Text style={styles.brandName}>{brand.name}</Text>
                      <Text style={styles.brandDescription}>{brand.description}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.checkbox,
                        selectedBrands.includes(brand.id) && styles.checkboxSelected
                      ]}
                    >
                      {selectedBrands.includes(brand.id) && (
                        <Ionicons name="checkmark" size={16} color={Colors.text} />
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.brandDetails}>
                    <View style={styles.brandTags}>
                      <View style={[styles.tag, { backgroundColor: getPriceRangeColor(brand.priceRange) }]}>
                        <Text style={styles.tagText}>{brand.priceRange}</Text>
                      </View>
                      <View style={[styles.tag, { backgroundColor: getSustainabilityColor(brand.sustainability) }]}>
                        <Text style={styles.tagText}>{brand.sustainability} sustainability</Text>
                      </View>
                    </View>
                    
                    <View style={styles.brandStats}>
                      <View style={styles.stat}>
                        <Ionicons name="star" size={14} color={Colors.accent} />
                        <Text style={styles.statText}>{brand.rating}</Text>
                      </View>
                      <Text style={styles.statText}>({brand.reviewCount} reviews)</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: Colors.text,
    fontWeight: 'bold',
  },
  descriptionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.backgroundCard,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  selectedCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categoryContainer: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  brandsContainer: {
    gap: 12,
  },
  brandCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  brandCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundCard,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandLogo: {
    width: 60,
    height: 30,
    marginRight: 12,
  },
  brandInfo: {
    flex: 1,
  },
  brandName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  brandDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  brandDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 10,
    color: Colors.text,
    fontWeight: 'bold',
  },
  brandStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
}); 