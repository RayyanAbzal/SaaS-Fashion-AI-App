import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const API_BASE = 'http://localhost:3000/api';

export default function PinterestBoardScreen() {
  const [boardUrl, setBoardUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [clothingResults, setClothingResults] = useState<any[]>([]);
  const [productResults, setProductResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [perImageLoading, setPerImageLoading] = useState<Record<string, boolean>>({});
  const [gender, setGender] = useState<'female' | 'male'>('female');

  const handleAnalyzeBoard = async () => {
    setLoading(true);
    setError(null);
    setStep(1);
    setImageUrls([]);
    setClothingResults([]);
    setProductResults([]);
    try {
      // 1. Get image URLs from Pinterest board
      const res = await fetch(`${API_BASE}/pinterest-board-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardUrl }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to analyze board');
      if (!data.images || data.images.length === 0) throw new Error('No images found on board');
      setImageUrls(data.images);
      setStep(2);

      // 2. Analyze images for clothing items
      const clothingRes = await fetch(`${API_BASE}/analyze-images-for-clothing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: data.images }),
      });
      const clothingData = await clothingRes.json();
      if (!clothingData.success) throw new Error(clothingData.error || 'Failed to analyze images');
      setClothingResults(clothingData.results);
      setStep(3);

      // 3. Find similar products for all detected clothing items (across all images)
      const allItems = clothingData.results.flatMap((r: any) =>
        Array.isArray(r.analyses)
          ? r.analyses.filter((a: any) => a.isValidClothing)
          : []
      );
      if (allItems.length === 0) throw new Error('No valid clothing items detected.');
      const productRes = await fetch(`${API_BASE}/find-similar-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: allItems, region: 'nz', gender }),
      });
      const productData = await productRes.json();
      if (!productData.success) throw new Error(productData.error || 'Failed to find similar products');
      setProductResults(productData.results);
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      Alert.alert('Error', err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Helper to open links (works on web and native)
  const openLink = (url: string) => {
    if (!url) return;
    console.log('Opening link:', url); // Debug
    Linking.openURL(url).catch((err) => {
      Alert.alert('Error', "Couldn't open the link.");
    });
  };

  const getProductResultsForClothing = (clothing: any) => {
    // Find the product result for this clothing item (by description)
    return productResults.find(
      (res: any) => res.item && res.item.description === clothing.description
    );
  };

  const allDetectedClothing = clothingResults.flatMap((result: any) =>
    Array.isArray(result.analyses)
      ? result.analyses.filter((a: any) => a.isValidClothing)
      : []
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Pinterest Board Analyzer</Text>
        <Text style={styles.subtitle}>
          Paste a public Pinterest board link to find shoppable looks and generate outfits!
        </Text>
        {/* Gender selector */}
        <View style={{ flexDirection: 'row', marginBottom: 10, alignItems: 'center' }}>
          <Text style={{ color: Colors.text, marginRight: 10 }}>Shopping for:</Text>
          <TouchableOpacity
            style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
            onPress={() => setGender('female')}
          >
            <Text style={[styles.genderButtonText, gender === 'female' && styles.genderButtonTextActive]}>Women</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
            onPress={() => setGender('male')}
          >
            <Text style={[styles.genderButtonText, gender === 'male' && styles.genderButtonTextActive]}>Men</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Paste Pinterest board URL..."
          value={boardUrl}
          onChangeText={setBoardUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleAnalyzeBoard}
          disabled={loading || !boardUrl.trim()}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Analyze Board</Text>
          )}
        </TouchableOpacity>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {step >= 2 && (
          <View style={styles.section}>
            {/* Informational message about API limit */}
            <Text style={[styles.infoText, { marginBottom: 8 }]}>⚠️ For testing, only the first 2 detected clothing items will show shoppable matches due to API limits.</Text>
            <Text style={styles.sectionTitle}>Board Images & Detected Clothing</Text>
            {imageUrls.slice(0, 20).map((url, idx) => {
              const clothingResult = clothingResults[idx];
              const analyses = Array.isArray(clothingResult?.analyses) ? clothingResult.analyses : [];
              return (
                <View key={idx} style={styles.imageClothingGroup}>
                  <Image source={{ uri: url }} style={styles.imageThumbLarge} resizeMode="cover" />
                  <View style={styles.clothingItem}>
                    <Text style={styles.clothingLabel}>Image {idx + 1}</Text>
                    {clothingResult && clothingResult.error && (
                      <Text style={styles.errorText}>Error: {clothingResult.error}</Text>
                    )}
                    {analyses.length > 0 ? (
                      analyses.map((clothing: any, cidx: number) => {
                        const productResult = getProductResultsForClothing(clothing);
                        return (
                          <View key={cidx} style={{ marginBottom: 16 }}>
                            <Text style={styles.clothingText}>{clothing.description}</Text>
                            <Text style={styles.clothingText}>
                              {clothing.category} / {clothing.subcategory} | {clothing.color} | {clothing.style}
                            </Text>
                            {/* Loading indicator for this clothing item */}
                            {perImageLoading && perImageLoading[`${idx}_${cidx}`] && (
                              <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 8 }} />
                            )}
                            {productResult && productResult.similarProducts && productResult.similarProducts.length > 0 && (
                              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
                                {productResult.similarProducts.map((prod: any, pidx: number) => (
                                  <View key={pidx} style={styles.productCard}>
                                    <TouchableOpacity onPress={() => openLink(prod.purchaseUrl)} activeOpacity={0.85}>
                                      <Image source={{ uri: prod.imageUrl }} style={styles.productImage} />
                                    </TouchableOpacity>
                                    <Text style={styles.productName} numberOfLines={2} ellipsizeMode="tail">{prod.name}</Text>
                                    {prod.price && (
                                      <TouchableOpacity onPress={() => openLink(prod.purchaseUrl)} activeOpacity={0.85}>
                                        <Text style={styles.productPrice}>{typeof prod.price === 'string' ? prod.price : `$${prod.price}`}</Text>
                                      </TouchableOpacity>
                                    )}
                                  </View>
                                ))}
                              </ScrollView>
                            )}
                            {productResult && (!productResult.similarProducts || productResult.similarProducts.length === 0) && (!perImageLoading || !perImageLoading[`${idx}_${cidx}`]) && (
                              <Text style={styles.clothingText}>No similar products found.</Text>
                            )}
                          </View>
                        );
                      })
                    ) : (
                      <Text style={styles.clothingText}>No valid clothing detected.</Text>
                    )}
                  </View>
                </View>
              );
            })}
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
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: Colors.backgroundCard,
    color: Colors.text,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: Colors.error,
    marginBottom: 10,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  imageRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  imageClothingGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 10,
    padding: 10,
  },
  imageThumbLarge: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginRight: 14,
    backgroundColor: Colors.backgroundCard,
  },
  clothingItem: {
    marginBottom: 12,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 8,
    padding: 10,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  clothingLabel: {
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 2,
  },
  clothingText: {
    color: Colors.text,
    fontSize: 14,
  },
  productGroup: {
    marginBottom: 18,
  },
  productCard: {
    width: 120,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 8,
    padding: 8,
    marginRight: 10,
    alignItems: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: 80,
    height: 100,
    borderRadius: 6,
    marginBottom: 6,
    backgroundColor: Colors.background,
  },
  productName: {
    fontWeight: 'bold',
    color: Colors.text,
    fontSize: 13,
    marginBottom: 2,
    textAlign: 'center',
    maxWidth: 100,
  },
  productBrand: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 2,
    textAlign: 'center',
    maxWidth: 100,
  },
  productPrice: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 2,
  },
  infoText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  genderButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginRight: 8,
    backgroundColor: Colors.backgroundCard,
  },
  genderButtonActive: {
    backgroundColor: Colors.primary,
  },
  genderButtonText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  genderButtonTextActive: {
    color: '#fff',
  },
}); 