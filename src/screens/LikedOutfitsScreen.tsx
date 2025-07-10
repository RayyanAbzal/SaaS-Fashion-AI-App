import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { OutfitSuggestion, WardrobeItem, ShoppingItem, Outfit } from '../types';
import { FirestoreService } from '../services/firestoreService';
import { AuthService } from '../services/authService';
import { useNavigation } from '@react-navigation/native';
import { StyleService } from '../services/styleService';

type OutfitCategory = 'liked' | 'created' | 'ai-generated' | 'pinterest' | 'all';

interface LikedOutfit {
  id: string;
  outfitSuggestion: OutfitSuggestion;
  likedAt: Date;
  outfitSignature: string;
}

export default function OutfitsScreen() {
  const [activeTab, setActiveTab] = useState<OutfitCategory>('liked');
  const [likedOutfits, setLikedOutfits] = useState<LikedOutfit[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    loadOutfits();
  }, [activeTab]);

  const loadOutfits = async () => {
    try {
      setLoading(true);
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) {
        console.warn('No current user found');
        setLikedOutfits([]);
        setSavedOutfits([]);
        return;
      }

      if (activeTab === 'liked') {
        await loadLikedOutfits(currentUser.id);
      } else {
        await loadSavedOutfits(currentUser.id);
      }
    } catch (error) {
      console.error('Error loading outfits:', error);
      Alert.alert('Error', 'Failed to load outfits');
    } finally {
      setLoading(false);
    }
  };

  const loadLikedOutfits = async (userId: string) => {
    // Get swipe history for liked outfits
    const swipeHistory = await FirestoreService.getSwipeHistory(userId);
    const likedSwipes = swipeHistory.filter(swipe => 
      swipe.action === 'like' || swipe.action === 'super-like'
    );

    // Convert swipe history to liked outfits with reconstructed items
    const outfits: LikedOutfit[] = [];
    
    for (const swipe of likedSwipes) {
      const outfitSignature = swipe.context?.outfitSignature || '';
      if (outfitSignature) {
        const reconstructedItems = await StyleService.reconstructOutfitFromSignature(
          outfitSignature,
          userId
        );
        
        outfits.push({
          id: swipe.id,
          outfitSuggestion: {
            id: swipe.outfitId,
            items: reconstructedItems,
            reasoning: 'Liked outfit from swiper',
            occasion: swipe.context?.occasion || 'casual',
            weather: swipe.context?.weather ? [swipe.context.weather.condition] : [],
            confidence: 0.8
          },
          likedAt: new Date(swipe.timestamp),
          outfitSignature: outfitSignature
        });
      }
    }

    setLikedOutfits(outfits);
  };

  const loadSavedOutfits = async (userId: string) => {
    const outfits = await FirestoreService.getOutfits(userId);
    
    // Filter based on active tab
    let filteredOutfits = outfits;
    switch (activeTab) {
      case 'created':
        filteredOutfits = outfits.filter(outfit => !outfit.aiGenerated && !outfit.tags.includes('liked'));
        break;
      case 'ai-generated':
        filteredOutfits = outfits.filter(outfit => outfit.aiGenerated && !outfit.tags.includes('liked'));
        break;
      case 'pinterest':
        filteredOutfits = outfits.filter(outfit => outfit.tags.includes('pinterest'));
        break;
      case 'all':
        filteredOutfits = outfits;
        break;
    }
    
    setSavedOutfits(filteredOutfits);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOutfits();
    setRefreshing(false);
  };

  const handleRemoveOutfit = async (outfitId: string) => {
    Alert.alert(
      'Remove Outfit',
      'Are you sure you want to remove this outfit from your liked outfits?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const currentUser = await AuthService.getCurrentUser();
              if (currentUser) {
                // Remove from swipe history (mark as disliked)
                await FirestoreService.addSwipeRecord(
                  currentUser.id,
                  outfitId,
                  'dislike',
                  { removedFromLiked: true }
                );
                // Remove from local state
                setLikedOutfits(prev => prev.filter(outfit => outfit.id !== outfitId));
              }
            } catch (error) {
              console.error('Error removing outfit:', error);
              Alert.alert('Error', 'Failed to remove outfit');
            }
          }
        }
      ]
    );
  };

  const handleDeleteOutfit = async (outfitId: string) => {
    Alert.alert(
      'Delete Outfit',
      'Are you sure you want to delete this outfit? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const currentUser = await AuthService.getCurrentUser();
              if (currentUser) {
                // Delete from Firestore
                await FirestoreService.deleteOutfit(currentUser.id, outfitId);
                // Remove from local state
                setSavedOutfits(prev => prev.filter(outfit => outfit.id !== outfitId));
              }
            } catch (error) {
              console.error('Error deleting outfit:', error);
              Alert.alert('Error', 'Failed to delete outfit');
            }
          }
        }
      ]
    );
  };

  const renderTabButton = (category: OutfitCategory, title: string, icon: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === category && styles.activeTabButton]}
      onPress={() => setActiveTab(category)}
    >
      <Ionicons 
        name={icon as any} 
        size={20} 
        color={activeTab === category ? Colors.primary : Colors.textSecondary} 
      />
      <Text style={[styles.tabButtonText, activeTab === category && styles.activeTabButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderLikedOutfitCard = ({ item }: { item: LikedOutfit }) => {
    const wardrobeItems = item.outfitSuggestion.items.filter(item => 'userId' in item) as WardrobeItem[];
    const shoppingItems = item.outfitSuggestion.items.filter(item => !('userId' in item)) as ShoppingItem[];

    return (
      <View style={styles.outfitCard}>
        <View style={styles.outfitHeader}>
          <Text style={styles.outfitTitle}>Liked from Swiper</Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveOutfit(item.id)}
          >
            <Ionicons name="close-circle" size={24} color={Colors.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.itemsContainer}>
          {item.outfitSuggestion.items.length > 0 ? (
            item.outfitSuggestion.items.slice(0, 3).map((outfitItem, index) => {
              const isWardrobeItem = 'userId' in outfitItem;
              return (
                <View key={`${outfitItem.id}-${index}`} style={styles.itemCard}>
                  <Image 
                    source={{ uri: outfitItem.imageUrl }} 
                    style={styles.itemImage}
                    defaultSource={{ uri: 'https://via.placeholder.com/150x200' }}
                  />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {outfitItem.name}
                    </Text>
                    <Text style={styles.itemBrand}>{outfitItem.brand}</Text>
                    <View style={[
                      styles.itemTag,
                      isWardrobeItem ? styles.wardrobeTag : styles.shoppingTag
                    ]}>
                      <Text style={styles.itemTagText}>
                        {isWardrobeItem ? 'Wardrobe' : 'Shop Now'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="shirt-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.placeholderText}>Outfit items not available</Text>
            </View>
          )}
        </View>

        <View style={styles.outfitFooter}>
          <Text style={styles.reasoningText} numberOfLines={2}>
            {item.outfitSuggestion.reasoning}
          </Text>
          <Text style={styles.likedDate}>
            Liked on {item.likedAt.toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  };

  const renderSavedOutfitCard = ({ item }: { item: Outfit }) => (
    <View style={styles.outfitCard}>
      <View style={styles.outfitHeader}>
        <Text style={styles.outfitTitle}>{item.name}</Text>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleDeleteOutfit(item.id)}
        >
          <Ionicons name="trash-outline" size={24} color={Colors.error} />
        </TouchableOpacity>
      </View>

      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.outfitImage} />
      )}

      <View style={styles.outfitFooter}>
        <Text style={styles.outfitDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.likedDate}>
          Created on {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your outfits...</Text>
      </SafeAreaView>
    );
  }

  const currentData = activeTab === 'liked' ? likedOutfits : savedOutfits;
  const isEmpty = currentData.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Outfits</Text>
        <Text style={styles.headerSubtitle}>
          {currentData.length} outfit{currentData.length !== 1 ? 's' : ''} in {activeTab}
        </Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {renderTabButton('liked', 'Liked', 'heart')}
        {renderTabButton('created', 'Created', 'create')}
        {renderTabButton('ai-generated', 'AI Generated', 'sparkles')}
        {renderTabButton('pinterest', 'Pinterest', 'logo-pinterest')}
        {renderTabButton('all', 'All', 'grid')}
      </ScrollView>

      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="shirt-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No outfits yet</Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'liked' 
              ? 'Start swiping in "What should I wear?" to like some outfits!'
              : 'Create your first outfit to get started!'
            }
          </Text>
          {activeTab === 'liked' && (
            <TouchableOpacity 
              style={styles.startSwipingButton}
              onPress={() => navigation.navigate('OutfitSwiper' as never)}
            >
              <Text style={styles.startSwipingButtonText}>Start Swiping</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          {activeTab === 'liked' ? (
            <FlatList
              data={likedOutfits}
              renderItem={renderLikedOutfitCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <FlatList
              data={savedOutfits}
              renderItem={renderSavedOutfitCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}
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
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  startSwipingButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  startSwipingButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  outfitCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  outfitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  outfitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  removeButton: {
    padding: 4,
  },
  itemsContainer: {
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  itemImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
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
    marginBottom: 6,
  },
  itemTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  wardrobeTag: {
    backgroundColor: Colors.primary,
  },
  shoppingTag: {
    backgroundColor: Colors.secondary,
  },
  itemTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.text,
  },
  placeholderContainer: {
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  outfitFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  reasoningText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  likedDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  tabsContainer: {
    padding: 10,
  },
  tabsContent: {
    padding: 10,
  },
  tabButton: {
    padding: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 10,
    marginRight: 10,
  },
  activeTabButton: {
    borderColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  activeTabButtonText: {
    color: Colors.primary,
  },
  outfitImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  outfitDescription: {
    fontSize: 14,
    color: Colors.text,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tag: {
    backgroundColor: Colors.secondary,
    padding: 5,
    borderRadius: 5,
    marginRight: 5,
  },
  tagText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.text,
  },
}); 