import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { 
  WardrobeItem, 
  Occasion, 
  OutfitCreationRequest, 
  OccasionConfig, 
  RetailerConfig,
  OutfitGenerationResult 
} from '../types';
import OutfitGenerationService from '../services/outfitGenerationService';
import { WeatherService } from '../services/weatherService';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

interface OutfitCreationScreenProps {
  navigation: any;
  route: {
    params: {
      selectedItems: WardrobeItem[];
    };
  };
}

export default function OutfitCreationScreen({ navigation, route }: OutfitCreationScreenProps) {
  const { selectedItems } = route.params;
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion>('casual');
  const [selectedRetailers, setSelectedRetailers] = useState<string[]>(['countryroad']);
  const [includeWardrobeOnly, setIncludeWardrobeOnly] = useState(false);
  const [considerWeather, setConsiderWeather] = useState(true);
  const [considerStylePreferences, setConsiderStylePreferences] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<OutfitGenerationResult | null>(null);
  const [availableOccasions, setAvailableOccasions] = useState<OccasionConfig[]>([]);
  const [availableRetailers, setAvailableRetailers] = useState<RetailerConfig[]>([]);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = () => {
    setAvailableOccasions(OutfitGenerationService.getAvailableOccasions());
    setAvailableRetailers(OutfitGenerationService.getAvailableRetailers());
  };

  const handleGenerateOutfits = async () => {
    if (selectedItems.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item from your wardrobe.');
      return;
    }

    setIsGenerating(true);
    try {
      // Get current weather if needed
      let weather;
      if (considerWeather) {
        const location = await WeatherService.getCurrentLocation();
        weather = await WeatherService.getCurrentWeather(location.coords.latitude, location.coords.longitude);
      }

      const request: OutfitCreationRequest = {
        selectedItems,
        occasion: selectedOccasion,
        weather: weather || undefined,
        stylePreferences: considerStylePreferences ? ['modern', 'comfortable'] : undefined,
        retailerPreferences: {
          enabled: selectedRetailers.length > 0,
          retailers: selectedRetailers,
          includeWardrobeOnly
        },
        aiPreferences: {
          considerWeather,
          considerOccasion: true,
          considerStylePreferences,
          generateMultipleOutfits: true,
          maxOutfits: 3
        }
      };

      const result = await OutfitGenerationService.generateOutfits(request);
      setGenerationResult(result);
      
      // Navigate to outfit swiper with the generated outfits
      navigation.navigate('OutfitSwiper', { 
        outfits: result.outfits,
        analysis: result.analysis,
        recommendations: result.recommendations
      });

    } catch (error) {
      console.error('Error generating outfits:', error);
      Alert.alert('Error', 'Failed to generate outfits. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleRetailer = (retailerId: string) => {
    setSelectedRetailers(prev => 
      prev.includes(retailerId) 
        ? prev.filter(id => id !== retailerId)
        : [...prev, retailerId]
    );
  };

  const renderSelectedItems = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Selected Items ({selectedItems.length})</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsScroll}>
        {selectedItems.map((item, index) => (
          <View key={item.id} style={styles.selectedItem}>
            <Image source={{ uri: item.imageUrl }} style={styles.selectedItemImage} />
            <Text style={styles.selectedItemName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.selectedItemCategory}>{item.category}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderOccasionSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Occasion</Text>
      <View style={styles.occasionGrid}>
        {availableOccasions.map((occasion) => (
          <TouchableOpacity
            key={occasion.id}
            style={[
              styles.occasionCard,
              selectedOccasion === occasion.id && styles.occasionCardSelected
            ]}
            onPress={() => setSelectedOccasion(occasion.id as Occasion)}
          >
            <Ionicons 
              name={occasion.icon as any} 
              size={24} 
              color={selectedOccasion === occasion.id ? Colors.primary : Colors.textSecondary} 
            />
            <Text style={[
              styles.occasionName,
              selectedOccasion === occasion.id && styles.occasionNameSelected
            ]}>
              {occasion.name}
            </Text>
            <Text style={styles.occasionDescription} numberOfLines={2}>
              {occasion.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderRetailerSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Shopping Preferences</Text>
      
      <View style={styles.retailerToggle}>
        <Text style={styles.retailerToggleLabel}>Include shopping suggestions</Text>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedRetailers.length > 0 && styles.toggleButtonActive
          ]}
          onPress={() => {
            if (selectedRetailers.length > 0) {
              setSelectedRetailers([]);
            } else {
              setSelectedRetailers(['countryroad']);
            }
          }}
        >
          <Ionicons 
            name={selectedRetailers.length > 0 ? 'checkmark' : 'close'} 
            size={16} 
            color={Colors.text} 
          />
        </TouchableOpacity>
      </View>

      {selectedRetailers.length > 0 && (
        <>
          <View style={styles.retailerGrid}>
            {availableRetailers.map((retailer) => (
              <TouchableOpacity
                key={retailer.id}
                style={[
                  styles.retailerCard,
                  selectedRetailers.includes(retailer.id) && styles.retailerCardSelected
                ]}
                onPress={() => toggleRetailer(retailer.id)}
              >
                <Image source={{ uri: retailer.logo }} style={styles.retailerLogo} />
                <Text style={[
                  styles.retailerName,
                  selectedRetailers.includes(retailer.id) && styles.retailerNameSelected
                ]}>
                  {retailer.name}
                </Text>
                <Text style={styles.retailerPriceRange}>{retailer.priceRange}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.wardrobeOnlyToggle}
            onPress={() => setIncludeWardrobeOnly(!includeWardrobeOnly)}
          >
            <Ionicons 
              name={includeWardrobeOnly ? 'checkmark-circle' : 'ellipse-outline'} 
              size={20} 
              color={includeWardrobeOnly ? Colors.primary : Colors.textSecondary} 
            />
            <Text style={styles.wardrobeOnlyText}>
              Include wardrobe-only outfits (no shopping items)
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const renderAIPreferences = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>AI Preferences</Text>
      
      <TouchableOpacity
        style={styles.preferenceRow}
        onPress={() => setConsiderWeather(!considerWeather)}
      >
        <Ionicons 
          name={considerWeather ? 'checkmark-circle' : 'ellipse-outline'} 
          size={20} 
          color={considerWeather ? Colors.primary : Colors.textSecondary} 
        />
        <Text style={styles.preferenceText}>Consider current weather</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.preferenceRow}
        onPress={() => setConsiderStylePreferences(!considerStylePreferences)}
      >
        <Ionicons 
          name={considerStylePreferences ? 'checkmark-circle' : 'ellipse-outline'} 
          size={20} 
          color={considerStylePreferences ? Colors.primary : Colors.textSecondary} 
        />
        <Text style={styles.preferenceText}>Consider style preferences</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Outfit</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSelectedItems()}
        {renderOccasionSelection()}
        {renderRetailerSelection()}
        {renderAIPreferences()}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.generateButton,
            (isGenerating || selectedItems.length === 0) && styles.generateButtonDisabled
          ]}
          onPress={handleGenerateOutfits}
          disabled={isGenerating || selectedItems.length === 0}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color={Colors.text} />
          ) : (
            <Ionicons name="sparkles" size={20} color={Colors.text} />
          )}
          <Text style={styles.generateButtonText}>
            {isGenerating ? 'Generating...' : 'Generate Outfits'}
          </Text>
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 12,
  },
  headerSpacer: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  itemsScroll: {
    flexDirection: 'row',
  },
  selectedItem: {
    width: 100,
    marginRight: 12,
    alignItems: 'center',
  },
  selectedItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedItemName: {
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedItemCategory: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  occasionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  occasionCard: {
    width: (width - 48) / 2,
    padding: 16,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  occasionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  occasionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  occasionNameSelected: {
    color: Colors.primary,
  },
  occasionDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retailerToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  retailerToggleLabel: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  toggleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  retailerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  retailerCard: {
    width: (width - 48) / 2,
    padding: 16,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  retailerCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  retailerLogo: {
    width: 60,
    height: 30,
    marginBottom: 8,
    resizeMode: 'contain',
  },
  retailerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  retailerNameSelected: {
    color: Colors.primary,
  },
  retailerPriceRange: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  wardrobeOnlyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  wardrobeOnlyText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  preferenceText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
  },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
}); 