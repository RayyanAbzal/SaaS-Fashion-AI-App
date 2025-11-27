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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { 
  WardrobeItem, 
  Occasion, 
  OutfitCreationRequest, 
  OccasionConfig,
  OutfitGenerationResult,
  RootStackParamList
} from '../types';
import OutfitCreationService from '../services/outfitCreationService';
import { WeatherService } from '../services/weatherService';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type OutfitCreationScreenProps = NativeStackScreenProps<RootStackParamList, 'OutfitCreation'>;

export default function OutfitCreationScreen({ navigation, route }: OutfitCreationScreenProps) {
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | null>(null);
  const [selectedRetailers, setSelectedRetailers] = useState<string[]>([]);
  const [wardrobeOnly, setWardrobeOnly] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [availableRetailers, setAvailableRetailers] = useState<any[]>([]);
  const [availableOccasions, setAvailableOccasions] = useState<OccasionConfig[]>([]);

  const loadConfiguration = () => {
    // Load available occasions and retailers
    setAvailableOccasions(OutfitCreationService.getAvailableOccasions());
    // For now, use empty array for retailers since the method doesn't exist
    setAvailableRetailers([]);
  };

  const handleGenerateOutfits = async () => {
    if (!selectedOccasion) {
      Alert.alert('Error', 'Please select an occasion');
      return;
    }

    setIsGenerating(true);

    try {
      // Get user's location for weather data
      const { status } = await Location.requestForegroundPermissionsAsync();
      let weatherData = null;

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        weatherData = await WeatherService.getCurrentWeather(location.coords.latitude, location.coords.longitude);
      }

      const request: OutfitCreationRequest = {
        selectedItems: route.params?.selectedItems || [],
        occasion: selectedOccasion,
        weather: weatherData || undefined,
        stylePreferences: ['casual'],
        retailerPreferences: {
          enabled: !wardrobeOnly,
          retailers: selectedRetailers,
          includeWardrobeOnly: wardrobeOnly,
        },
        aiPreferences: {
          considerWeather: true,
          considerOccasion: true,
          considerStylePreferences: true,
          generateMultipleOutfits: true,
          maxOutfits: 3,
        },
      };

      // For streamlined UX, open AI Stylist which generates and handles swiping
      navigation.navigate('StyleSwipe', {});

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
      <Text style={styles.sectionTitle}>Selected Items ({route.params.selectedItems.length})</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsScroll}>
        {route.params.selectedItems.map((item, index) => (
          <View key={index} style={styles.selectedItem}>
            <Image source={{ uri: item.imageUrl }} style={styles.selectedItemImage} />
            <Text style={styles.selectedItemName}>{item.name}</Text>
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
              size={32} 
              color={selectedOccasion === occasion.id ? Colors.primary : Colors.textSecondary} 
            />
            <Text style={[
              styles.occasionName,
              selectedOccasion === occasion.id && styles.occasionNameSelected
            ]}>
              {occasion.name}
            </Text>
            <Text style={styles.occasionDescription}>{occasion.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderRetailerSelection = () => (
    <View style={styles.section}>
      <View style={styles.retailerToggle}>
        <Text style={styles.retailerToggleLabel}>Include Shopping Suggestions</Text>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            !wardrobeOnly && styles.toggleButtonActive
          ]}
          onPress={() => setWardrobeOnly(!wardrobeOnly)}
        >
          <Ionicons 
            name={wardrobeOnly ? 'close' : 'checkmark'} 
            size={16} 
            color={wardrobeOnly ? Colors.textSecondary : Colors.text} 
          />
        </TouchableOpacity>
      </View>

      {!wardrobeOnly && (
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
              {retailer.logo && (
                <Image source={{ uri: retailer.logo }} style={styles.retailerLogo} />
              )}
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
      )}
    </View>
  );

  const renderAIPreferences = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>AI Preferences</Text>
      
      <View style={styles.wardrobeOnlyToggle}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            wardrobeOnly && styles.toggleButtonActive
          ]}
          onPress={() => setWardrobeOnly(!wardrobeOnly)}
        >
          <Ionicons 
            name={wardrobeOnly ? 'checkmark' : 'close'} 
            size={16} 
            color={wardrobeOnly ? Colors.text : Colors.textSecondary} 
          />
        </TouchableOpacity>
        <Text style={styles.wardrobeOnlyText}>Wardrobe items only</Text>
      </View>

      <View style={styles.preferenceRow}>
        <Ionicons name="color-palette" size={16} color={Colors.textSecondary} />
        <Text style={styles.preferenceText}>Color harmony</Text>
      </View>

      <View style={styles.preferenceRow}>
        <Ionicons name="thermometer" size={16} color={Colors.textSecondary} />
        <Text style={styles.preferenceText}>Weather appropriate</Text>
      </View>

      <View style={styles.preferenceRow}>
        <Ionicons name="heart" size={16} color={Colors.textSecondary} />
        <Text style={styles.preferenceText}>Style preferences</Text>
      </View>
    </View>
  );

  useEffect(() => {
    loadConfiguration();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
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
            (!selectedOccasion || isGenerating) && styles.generateButtonDisabled
          ]}
          onPress={handleGenerateOutfits}
          disabled={!selectedOccasion || isGenerating}
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
    width: 150,
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
    color: Colors.text,
  },
  retailerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  retailerCard: {
    width: 150,
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