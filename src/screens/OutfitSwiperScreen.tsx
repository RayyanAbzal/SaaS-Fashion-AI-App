import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Outfit, OutfitSuggestion, WardrobeItem, ShoppingItem } from '../types';
import { getWardrobeItems } from '../services/wardrobeService';
import { getCurrentWeather } from '../services/weatherService';
import { StyleService } from '../services/styleService';
import { AuthService } from '../services/authService';
import { FirestoreService } from '../services/firestoreService';
import Swiper from 'react-native-deck-swiper';

const { width, height } = Dimensions.get('window');

interface OutfitSwiperScreenProps {
  navigation: any;
}

const OutfitCard = ({ card }: { card: OutfitSuggestion }) => {
  const wardrobeItems = card.items.filter(item => 'userId' in item).map(item => item as unknown as WardrobeItem);
  const shoppingItems = card.items.filter(item => !('userId' in item)) as ShoppingItem[];

  const renderItem = (item: WardrobeItem | ShoppingItem, index: number) => {
    const isWardrobeItem = 'userId' in item;
    return (
      <View key={item.id + index} style={styles.itemContainer}>
        <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
        <View style={styles.itemDetails}>
            <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.itemBrand}>{item.brand}</Text>
            {isWardrobeItem ? (
                <View style={styles.itemTagWardrobe}>
                    <Text style={styles.itemTagText}>From Your Wardrobe</Text>
                </View>
            ) : (
                <View style={styles.itemTagShopping}>
                    <Text style={styles.itemTagText}>Shop Now</Text>
                </View>
            )}
        </View>
      </View>
    );
  };
    
  return (
    <View style={styles.card}>
      <Text style={styles.outfitName}>Outfit Suggestion</Text>
      <View style={styles.itemsRow}>
        {card.items.slice(0, 2).map(renderItem)}
      </View>
      <Text style={styles.outfitReasoning}>{card.reasoning}</Text>
    </View>
  );
};

export default function OutfitSwiperScreen({ navigation }: OutfitSwiperScreenProps) {
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cardIndex, setCardIndex] = useState(0);
  const swiperRef = useRef<Swiper<OutfitSuggestion>>(null);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser) {
        const outfitSuggestions = await StyleService.getOutfitSuggestions(currentUser.id);
        setSuggestions(outfitSuggestions);
      } else {
        console.warn('No current user found for outfit suggestions');
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching outfit suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipe = async (index: number, action: 'like' | 'dislike' | 'superlike') => {
    setCardIndex(index + 1);
    const suggestion = suggestions[index];
    const currentUser = await AuthService.getCurrentUser();
    if(currentUser && suggestion){
      await FirestoreService.addSwipeRecord(currentUser.id, suggestion.id, action, {});
    }
  };

  const openShoppingLink = () => {
    if(suggestions.length === 0) return;
    const suggestion = suggestions[cardIndex];
    if (suggestion) {
        const shoppingItem = suggestion.items.find(item => !('userId' in item)) as ShoppingItem | undefined;
        if(shoppingItem && (shoppingItem.productUrl || shoppingItem.purchaseUrl)) {
            const url = shoppingItem.productUrl || shoppingItem.purchaseUrl;
            Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
        } else {
            Alert.alert("No Link", "This outfit doesn't have a shoppable item.");
        }
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Finding your next look...</Text>
      </SafeAreaView>
    );
  }

  if (suggestions.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Find Your Look</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.emptyContent}>
          <Ionicons name="sad-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>No new outfits for now!</Text>
          <Text style={styles.emptySubText}>Add more items to your wardrobe or select more brands to get new suggestions.</Text>
          <TouchableOpacity style={styles.button} onPress={fetchSuggestions}>
              <Text style={styles.buttonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Your Look</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Swiper
        ref={swiperRef}
        cards={suggestions}
        renderCard={(card: OutfitSuggestion) => <OutfitCard card={card} />}
        onSwipedLeft={(index: number) => handleSwipe(index, 'dislike')}
        onSwipedRight={(index: number) => handleSwipe(index, 'like')}
        onSwipedTop={(index: number) => handleSwipe(index, 'superlike')}
        onSwipedAll={() => {
            setCardIndex(0);
            setSuggestions([]);
            // Optionally fetch more here
        }}
        cardIndex={cardIndex}
        backgroundColor={'transparent'}
        stackSize={3}
        stackSeparation={15}
        animateOverlayLabelsOpacity
        overlayLabels={{
          left: { title: 'NOPE', style: { label: styles.overlayLabel, wrapper: styles.overlayWrapperLeft } },
          right: { title: 'LIKE', style: { label: styles.overlayLabel, wrapper: styles.overlayWrapperRight } },
          top: { title: 'LOVE IT', style: { label: styles.overlayLabel, wrapper: styles.overlayWrapperTop } },
        }}
      />
      <View style={styles.bottomControls}>
          <TouchableOpacity style={[styles.controlButton, {backgroundColor: 'red'}]} onPress={() => swiperRef.current?.swipeLeft()}>
              <Ionicons name="close" size={32} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlButton, {backgroundColor: 'blue'}]} onPress={openShoppingLink}>
              <Ionicons name="cart" size={32} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlButton, {backgroundColor: 'green'}]} onPress={() => swiperRef.current?.swipeRight()}>
              <Ionicons name="heart" size={32} color="#FFF" />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: Colors.text,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  card: {
    flex: 0.8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
    padding: 20,
    justifyContent: 'space-between',
  },
  outfitName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 15,
  },
  itemsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flex: 1,
  },
  itemContainer: {
    width: width * 0.35,
    alignItems: 'center',
  },
  itemImage: {
    width: '100%',
    height: height * 0.25,
    borderRadius: 15,
    marginBottom: 10,
  },
  itemDetails: {
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  itemBrand: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 5,
  },
  itemTagWardrobe: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  itemTagShopping: {
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  itemTagText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  outfitReasoning: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 15,
  },
  overlayLabel: {
    fontSize: 45,
    fontWeight: 'bold',
    color: 'white',
    borderWidth: 2,
    borderRadius: 10,
    padding: 10,
  },
  overlayWrapperLeft: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginTop: 30,
    marginLeft: -30,
    borderColor: 'red',
  },
  overlayWrapperRight: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginTop: 30,
    marginLeft: 30,
    borderColor: 'green',
  },
  overlayWrapperTop: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'blue',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 20,
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 20,
  },
  buttonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 10,
  },
  headerSpacer: {
    flex: 1,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
}); 