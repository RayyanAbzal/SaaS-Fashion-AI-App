import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';
import { CompositeScreenProps, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../constants/colors';
import { WardrobeItem, RootStackParamList, MainTabParamList } from '../types';
import { FirestoreService } from '../services/firestoreService';
import FirebaseStorageService from '../services/firebaseStorageService';
import { useUser } from '../contexts/UserContext';
import WardrobeItemForm from '../components/WardrobeItemForm';
import { AuthService } from '../services/authService';

type WardrobeScreenProps = BottomTabScreenProps<MainTabParamList, 'Wardrobe'>;

const CATEGORIES = [
  { key: 'all', label: 'All', icon: 'shirt-outline' },
  { key: 'tops', label: 'Tops', icon: 'shirt-outline' },
  { key: 'bottoms', label: 'Bottoms', icon: 'body-outline' },
  { key: 'shoes', label: 'Shoes', icon: 'football-outline' },
  { key: 'accessories', label: 'Accessories', icon: 'bag-outline' },
  { key: 'outerwear', label: 'Outerwear', icon: 'shirt-outline' },
];

export default function WardrobeScreen({ route }: WardrobeScreenProps) {
  const { user } = useUser();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [imageToAdd, setImageToAdd] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showSearch, setShowSearch] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={{ padding: 10 }} onPress={() => setShowSearch(!showSearch)}>
            <Ionicons name={showSearch ? "close" : "search-outline"} size={26} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 10 }} onPress={handleOpenNativeCamera}>
            <Ionicons name="camera-outline" size={26} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 10, marginLeft: 10 }} onPress={handleAddItemFromLibrary}>
            <Ionicons name="images-outline" size={26} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, showSearch]);

  useEffect(() => {
    // This effect handles the image coming back from the CameraScreen
    if (route.params?.capturedImageUri) {
      setImageToAdd(route.params.capturedImageUri);
      setSelectedItem(null);
      setIsFormVisible(true);
      // Reset the param to avoid re-triggering
      navigation.setParams({ capturedImageUri: undefined });
    }
  }, [route.params?.capturedImageUri]);

  useEffect(() => {
    const checkUserAndFetchItems = async () => {
      if (!user || !user.id) {
        setLoading(false);
        Alert.alert("Error", "You need to be logged in to see your wardrobe.");
        return;
      }

      setLoading(true);
      try {
        const unsubscribe = FirestoreService.onWardrobeUpdate(
          user.id,
          (updatedItems: WardrobeItem[]) => {
            // Ensure all items have required properties
            const validItems = (updatedItems || []).filter(item => 
              item && 
              item.id && 
              item.name && 
              item.brand && 
              item.category &&
              item.imageUrl
            );
            setItems(validItems);
            if (loading) setLoading(false);
          },
          (error: Error) => {
            console.error('Firestore error:', error);
            setLoading(false);
            Alert.alert('Error', 'Could not fetch wardrobe items.');
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error('Error in checkUserAndFetchItems:', error);
        setLoading(false);
        Alert.alert('Error', 'Failed to load wardrobe. Please try again.');
      }
    };

    checkUserAndFetchItems();
  }, [user]);

  useEffect(() => {
    let filtered = items || [];
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item && item.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item => {
        if (!item) return false;
        
        const name = item.name?.toLowerCase() || '';
        const brand = item.brand?.toLowerCase() || '';
        const subcategory = item.subcategory?.toLowerCase() || '';
        const tags = item.tags || [];
        const searchLower = searchQuery.toLowerCase();
        
        return name.includes(searchLower) ||
               brand.includes(searchLower) ||
               subcategory.includes(searchLower) ||
               tags.some(tag => tag?.toLowerCase().includes(searchLower));
      });
    }
    
    setFilteredItems(filtered);
  }, [items, selectedCategory, searchQuery]);

  const handleSaveItem = async (item: WardrobeItem) => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || !currentUser.id) {
        throw new Error("Authentication error: No user is currently logged in. Please log out and log back in.");
      }

      console.log('User is authenticated with ID:', currentUser.id);
      
      if (!imageToAdd) {
        throw new Error("No image is selected to be uploaded.");
      }
      
      const newItemId = selectedItem?.id || FirestoreService.getNewId();
      let finalItem: WardrobeItem = { 
        ...item, 
        id: newItemId, 
        userId: currentUser.id 
      };

      // Ensure all required properties are present
      if (!finalItem.name) finalItem.name = 'Untitled Item';
      if (!finalItem.brand) finalItem.brand = 'Unknown Brand';
      if (!finalItem.category) finalItem.category = 'tops';
      if (!finalItem.color) finalItem.color = 'unknown';
      if (!finalItem.size) finalItem.size = 'M';
      if (!finalItem.tags) finalItem.tags = [];
      if (finalItem.isFavorite === undefined) finalItem.isFavorite = false;
      if (!finalItem.wearCount) finalItem.wearCount = 0;
      if (finalItem.lastWorn === undefined) finalItem.lastWorn = null;
      if (!finalItem.weatherCompatibility) {
        finalItem.weatherCompatibility = {
          temperatureRange: { min: 0, max: 30 },
          weatherConditions: ['clear'],
          seasonality: ['all']
        };
      }

      if (!finalItem.createdAt) {
          finalItem.createdAt = new Date();
      }
      finalItem.updatedAt = new Date();
      
      console.log(`Attempting to upload image to path: wardrobe/${finalItem.userId}/${finalItem.id}`);
      const imageUrl = await FirebaseStorageService.uploadImage(imageToAdd, `wardrobe/${finalItem.userId}/${finalItem.id}`);
      console.log('Image uploaded successfully, URL:', imageUrl);
      
      const itemWithUrl = { ...finalItem, imageUrl };

      if (selectedItem) {
        console.log('Updating existing item in Firestore...');
        await FirestoreService.updateWardrobeItem(itemWithUrl);
        Alert.alert('Success', 'Item updated successfully!');
      } else {
        console.log('Adding new item to Firestore...');
        await FirestoreService.addWardrobeItem(itemWithUrl);
        Alert.alert('Success', 'Item added to your wardrobe!');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      Alert.alert('Error Saving Item', errorMessage);
    } finally {
      setIsFormVisible(false);
      setSelectedItem(null);
      setImageToAdd(null);
    }
  };

  const handleOpenNativeCamera = () => {
    navigation.navigate('Camera');
  };

  const handleAddItemFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageToAdd(result.assets[0].uri);
      setSelectedItem(null);
      setIsFormVisible(true);
    }
  };

  const handleDeleteItem = (item: WardrobeItem) => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => confirmDeleteItem(item) }
      ]
    );
  };

  const confirmDeleteItem = async (item: WardrobeItem) => {
    try {
      if (!item || !item.id || !item.userId) {
        Alert.alert("Error", "Invalid item data.");
        return;
      }
      
      await FirestoreService.deleteWardrobeItem(item.userId, item.id);
      Alert.alert("Success", "Item deleted.");
    } catch (error) {
      Alert.alert("Error", "Could not delete item.");
      console.error("Error deleting item:", error);
    }
  };

  const renderCategoryTab = ({ item }: { item: typeof CATEGORIES[0] }) => (
    <TouchableOpacity
      style={[
        styles.categoryTab,
        selectedCategory === item.key && styles.categoryTabActive
      ]}
      onPress={() => setSelectedCategory(item.key)}
    >
      <Ionicons 
        name={item.icon as any} 
        size={20} 
        color={selectedCategory === item.key ? Colors.primary : Colors.textSecondary} 
      />
      <Text style={[
        styles.categoryTabText,
        selectedCategory === item.key && styles.categoryTabTextActive
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: WardrobeItem }) => {
    // Ensure item has required properties
    if (!item || !item.id || !item.name || !item.brand || !item.imageUrl) {
      return null;
    }

    return (
      <TouchableOpacity 
          style={styles.itemContainer} 
          onPress={() => { 
              setSelectedItem(item); 
              setImageToAdd(item.imageUrl); 
              setIsFormVisible(true); 
          }}>
        <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemBrand} numberOfLines={1}>{item.brand}</Text>
        {item.subcategory && (
          <Text style={styles.itemSubcategory} numberOfLines={1}>{item.subcategory}</Text>
        )}
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteItem(item)}>
            <Ionicons name="trash-outline" size={20} color={Colors.text} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = (category: string) => {
    const categoryInfo = CATEGORIES.find(cat => cat.key === category);
    if (!categoryInfo || category === 'all') return null;
    
    const categoryItems = items.filter(item => item.category === category);
    if (categoryItems.length === 0) return null;

    return (
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderContent}>
          <Ionicons name={categoryInfo.icon as any} size={24} color={Colors.primary} />
          <Text style={styles.sectionTitle}>{categoryInfo.label}</Text>
          <Text style={styles.sectionCount}>({categoryItems.length})</Text>
        </View>
      </View>
    );
  };

  const renderSectionedItems = () => {
    if (selectedCategory !== 'all') {
      return (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={item => item?.id || Math.random().toString()}
          numColumns={2}
          contentContainerStyle={[
            styles.listContainer,
            filteredItems.length === 0 && styles.emptyListContainer
          ]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="shirt-outline" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No {selectedCategory} found</Text>
              <Text style={styles.emptySubtext}>Add some {selectedCategory} to your wardrobe.</Text>
            </View>
          }
        />
      );
    }

    // Group items by category for "All" view in the correct order
    const categoryOrder = ['tops', 'bottoms', 'shoes', 'accessories', 'outerwear'];
    const groupedItems = categoryOrder.map(category => {
      const categoryItems = items.filter(item => item.category === category);
      return { category, items: categoryItems };
    }).filter(group => group.items.length > 0);

    if (groupedItems.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="shirt-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>Your wardrobe is empty</Text>
          <Text style={styles.emptySubtext}>Add items using the camera or gallery.</Text>
        </View>
      );
    }

    return (
      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {groupedItems.map(({ category, items: categoryItems }) => (
          <View key={category} style={styles.categorySection}>
            {renderSectionHeader(category)}
            <View style={styles.categoryGrid}>
              {categoryItems.map(item => (
                <View key={item.id} style={styles.itemWrapper}>
                  {renderItem({ item })}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search your wardrobe..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Category Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabsContainer}
        contentContainerStyle={styles.categoryTabsContent}
      >
        {CATEGORIES.map(category => (
          <View key={category.key}>
            {renderCategoryTab({ item: category })}
          </View>
        ))}
      </ScrollView>

      {/* Items List */}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ flex: 1 }} />
      ) : (
        renderSectionedItems()
      )}
      
      {isFormVisible && imageToAdd && (
        <Modal
          animationType="slide"
          transparent={false}
          visible={isFormVisible}
          onRequestClose={() => {
            setIsFormVisible(false);
            setSelectedItem(null);
            setImageToAdd(null);
          }}
        >
          <WardrobeItemForm
            imageUri={imageToAdd}
            existingItem={selectedItem || undefined}
            onSave={handleSaveItem}
            onCancel={() => {
              setIsFormVisible(false);
              setSelectedItem(null);
              setImageToAdd(null);
            }}
          />
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background 
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearSearchButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    padding: 5,
  },
  categoryTabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryTabsContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: Colors.backgroundCard,
  },
  categoryTabActive: {
    backgroundColor: Colors.primary,
  },
  categoryTabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  categoryTabTextActive: {
    color: Colors.text,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 10,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 8,
  },
  sectionCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  itemWrapper: {
    width: '50%',
    padding: 6,
  },
  itemContainer: { 
    backgroundColor: Colors.backgroundCard, 
    borderRadius: 12, 
    padding: 12, 
    alignItems: 'center',
    height: 200,
  },
  itemImage: { 
    width: '100%', 
    height: 120, 
    borderRadius: 8 
  },
  itemName: { 
    marginTop: 8, 
    fontWeight: 'bold', 
    color: Colors.text, 
    fontSize: 14,
    textAlign: 'center',
  },
  itemBrand: { 
    color: Colors.textSecondary, 
    fontSize: 12, 
    marginTop: 2,
    textAlign: 'center',
  },
  itemSubcategory: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  deleteButton: { 
    position: 'absolute', 
    top: 5, 
    right: 5, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    padding: 5, 
    borderRadius: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '50%',
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
  emptyListContainer: {
    paddingBottom: 20,
  },
});