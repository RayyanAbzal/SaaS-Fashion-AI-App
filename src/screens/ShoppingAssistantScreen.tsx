// Shopping Assistant Screen - Browse and shop from online retailers
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { RetailerService, SearchFilters } from '../services/retailerService';
import { RetailerItem, ShoppingSuggestion } from '../services/enhancedOracleService';
import { AvatarService } from '../services/avatarService';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type ShoppingAssistantScreenProps = NativeStackScreenProps<RootStackParamList, 'ShoppingAssistant'>;

function ShoppingAssistantScreen({ navigation, route }: ShoppingAssistantScreenProps) {
  const [products, setProducts] = useState<RetailerItem[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<RetailerItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 500 });
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<RetailerItem[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    'All',
    'Tops',
    'Bottoms',
    'Dresses',
    'Outerwear',
    'Accessories',
    'Shoes',
  ];

  const brands = [
    'All',
    'Zara',
    'H&M',
    'ASOS',
    'COS',
    'Mango',
    'Uniqlo',
  ];

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, selectedCategory, selectedBrand, priceRange]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const filters: SearchFilters = {};
      if (selectedCategory && selectedCategory !== 'All') {
        filters.category = selectedCategory;
      }
      if (selectedBrand && selectedBrand !== 'All') {
        filters.brand = selectedBrand;
      }
      if (priceRange.min > 0) {
        filters.priceMin = priceRange.min;
      }
      if (priceRange.max < 500) {
        filters.priceMax = priceRange.max;
      }

      const results = await RetailerService.searchProducts(filters, route.params.userAvatar);
      setProducts(results);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredProducts(filtered);
  };

  const handleAddToCart = (item: RetailerItem) => {
    setCart(prev => [...prev, item]);
    Alert.alert('Added to Cart', `${item.name} has been added to your cart`);
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const handleViewProduct = (item: RetailerItem) => {
    navigation.navigate('ProductDetail', { item, userAvatar: route.params.userAvatar });
  };

  const renderProduct = ({ item }: { item: RetailerItem }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleViewProduct(item)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
      
      {item.originalPrice && item.originalPrice > item.price && (
        <View style={styles.saleBadge}>
          <Text style={styles.saleText}>
            {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
          </Text>
        </View>
      )}

      <View style={styles.productInfo}>
        <Text style={styles.brandName}>{item.brand}</Text>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.currentPrice}>${item.price}</Text>
          {item.originalPrice && item.originalPrice > item.price && (
            <Text style={styles.originalPrice}>${item.originalPrice}</Text>
          )}
        </View>

        {item.fitPrediction && (
          <View style={styles.fitPrediction}>
            <Text style={styles.fitText}>
              Fit: {item.fitPrediction.overall} ({item.fitPrediction.confidence}% confidence)
            </Text>
          </View>
        )}

        <View style={styles.productActions}>
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={() => handleAddToCart(item)}
          >
            <Ionicons name="add" size={16} color={Colors.background} />
            <Text style={styles.addToCartText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFilterModal = () => (
    <View style={styles.filterModal}>
      <View style={styles.filterHeader}>
        <Text style={styles.filterTitle}>Filters</Text>
        <TouchableOpacity onPress={() => setShowFilters(false)}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContent}>
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Category</Text>
          <View style={styles.filterOptions}>
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.filterOption,
                  selectedCategory === category && styles.filterOptionSelected,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.filterOptionText,
                  selectedCategory === category && styles.filterOptionTextSelected,
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Brand</Text>
          <View style={styles.filterOptions}>
            {brands.map(brand => (
              <TouchableOpacity
                key={brand}
                style={[
                  styles.filterOption,
                  selectedBrand === brand && styles.filterOptionSelected,
                ]}
                onPress={() => setSelectedBrand(brand)}
              >
                <Text style={[
                  styles.filterOptionText,
                  selectedBrand === brand && styles.filterOptionTextSelected,
                ]}>
                  {brand}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Price Range</Text>
          <View style={styles.priceRangeContainer}>
            <TextInput
              style={styles.priceInput}
              value={priceRange.min.toString()}
              onChangeText={(value) => setPriceRange(prev => ({ ...prev, min: parseInt(value) || 0 }))}
              placeholder="Min"
              keyboardType="numeric"
            />
            <Text style={styles.priceRangeText}>to</Text>
            <TextInput
              style={styles.priceInput}
              value={priceRange.max.toString()}
              onChangeText={(value) => setPriceRange(prev => ({ ...prev, max: parseInt(value) || 500 }))}
              placeholder="Max"
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.applyFiltersButton}
        onPress={() => {
          loadProducts();
          setShowFilters(false);
        }}
      >
        <Text style={styles.applyFiltersText}>Apply Filters</Text>
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
        <Text style={styles.headerTitle}>Shop</Text>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('ShoppingCart', { cart })}
        >
          <Ionicons name="bag" size={24} color={Colors.text} />
          {cart.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textSecondary}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="filter" size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipSelected,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextSelected,
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productsList}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadProducts}
      />

      {showFilters && (
        <View style={styles.filterOverlay}>
          {renderFilterModal()}
        </View>
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  cartButton: {
    padding: 8,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 12,
  },
  filterButton: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  categoryChip: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.text,
  },
  categoryTextSelected: {
    color: Colors.background,
    fontWeight: '500',
  },
  productsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  productCard: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    margin: 4,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  saleBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  saleText: {
    color: Colors.background,
    fontSize: 10,
    fontWeight: '600',
  },
  productInfo: {
    padding: 12,
  },
  brandName: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  originalPrice: {
    fontSize: 14,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  fitPrediction: {
    marginBottom: 8,
  },
  fitText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addToCartText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: '500',
  },
  filterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterOptionText: {
    fontSize: 14,
    color: Colors.text,
  },
  filterOptionTextSelected: {
    color: Colors.background,
    fontWeight: '500',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priceRangeText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  applyFiltersButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyFiltersText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ShoppingAssistantScreen;
