import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors } from '../constants/colors';
import { OutfitSuggestion, ShoppingItem, RootStackParamList, MainTabParamList } from '../types';
import { StyleService } from '../services/styleService';
import { useUser } from '../contexts/UserContext';

type StyleMateScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StyleMate'>;

export default function StyleMateScreen() {
  const { user } = useUser();
  const navigation = useNavigation<StyleMateScreenNavigationProp>();
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<OutfitSuggestion | null>(null);

  const generateOutfitSuggestions = async () => {
    if (!user || !user.id) {
      Alert.alert('Error', 'Please log in to use StyleMate.');
      return;
    }

    setLoading(true);
    try {
      const outfitSuggestions = await StyleService.getOutfitSuggestions(user.id);
      setSuggestions(outfitSuggestions);
    } catch (error) {
      console.error('Error generating outfit suggestions:', error);
      Alert.alert('Error', 'Failed to generate outfit suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion: OutfitSuggestion) => {
    setSelectedSuggestion(suggestion);
    // Navigate to outfit swiper with the selected suggestion
    // This needs to be implemented correctly. For now, let's just log it.
    console.log('Navigating with suggestion:', suggestion);
    // navigation.navigate('OutfitSwiper', { suggestion }); 
  };

  const renderSuggestion = (suggestion: OutfitSuggestion) => (
    <TouchableOpacity
      key={suggestion.id}
      style={styles.suggestionCard}
      onPress={() => handleSuggestionPress(suggestion)}
    >
      <View style={styles.suggestionHeader}>
        <Text style={styles.suggestionTitle}>Outfit Suggestion</Text>
        <Text style={styles.suggestionOccasion}>{suggestion.occasion}</Text>
      </View>
      
      <View style={styles.itemsContainer}>
        {suggestion.items.map((item: ShoppingItem, index: number) => (
          <View key={index} style={styles.itemCard}>
            <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.itemBrand}>{item.brand}</Text>
              <Text style={styles.itemPrice}>${item.price}</Text>
            </View>
          </View>
        ))}
      </View>
      
      <Text style={styles.reasoning}>{suggestion.reasoning}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Your AI Stylist</Text>
            <Text style={styles.headerSubtitle}>
                Get personalized outfit suggestions based on your wardrobe, style profile, and local weather.
            </Text>
        </View>

        <TouchableOpacity style={styles.generateButton} onPress={generateOutfitSuggestions} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>Get Outfit Ideas</Text>
          )}
        </TouchableOpacity>

        {suggestions.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <Ionicons name="sparkles-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>Ready for inspiration?</Text>
            <Text style={styles.emptySubtext}>Tap the button to get your first outfit suggestion.</Text>
          </View>
        )}

        {suggestions.map(renderSuggestion)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContainer: {
        padding: 20,
    },
    header: {
        marginBottom: 20,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
    },
    generateButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    generateButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text,
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 8,
    },
    suggestionCard: {
        backgroundColor: Colors.backgroundCard,
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
    },
    suggestionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    suggestionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    suggestionOccasion: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '600',
    },
    itemsContainer: {
        marginBottom: 10,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: Colors.background,
        borderRadius: 8,
        padding: 10,
    },
    itemImage: {
        width: 70,
        height: 70,
        borderRadius: 8,
    },
    itemInfo: {
        marginLeft: 10,
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
    },
    itemBrand: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginVertical: 2,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.primary,
    },
    reasoning: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontStyle: 'italic',
    },
});