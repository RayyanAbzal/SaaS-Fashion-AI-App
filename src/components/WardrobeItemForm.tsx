import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { Colors } from '../constants/colors';
import { WardrobeItem, Category } from '../types';
import OpenAIVisionService, { VisionAnalysis as AIAnalysis } from '../services/openaiVisionService';
import { fileToBase64 } from '../utils/fileUtils';
import { AuthService } from '../services/authService';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface WardrobeItemFormProps {
  imageUri: string;
  onSave: (item: WardrobeItem) => void;
  onCancel: () => void;
  existingItem?: WardrobeItem;
}

export default function WardrobeItemForm({
  imageUri,
  onSave,
  onCancel,
  existingItem,
}: WardrobeItemFormProps) {
  const [name, setName] = useState(existingItem?.name || '');
  const [category, setCategory] = useState<Category>(existingItem?.category || 'tops');
  const [subcategory, setSubcategory] = useState(existingItem?.subcategory || '');
  const [color, setColor] = useState(existingItem?.color || '');
  const [brand, setBrand] = useState(existingItem?.brand || '');
  const [size, setSize] = useState(existingItem?.size || '');
  const [tags, setTags] = useState<string[]>(existingItem?.tags || []);
  const [isFavorite, setIsFavorite] = useState(existingItem?.isFavorite || false);
  const [wearCount, setWearCount] = useState(existingItem?.wearCount || 0);
  const [lastWorn, setLastWorn] = useState(existingItem?.lastWorn);

  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(existingItem?.aiAnalysis || null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [customTag, setCustomTag] = useState('');

  const categories: Category[] = ['tops', 'bottoms', 'shoes', 'accessories', 'outerwear'];

  useEffect(() => {
    if (!existingItem) {
      handleAnalyze();
    } else {
      setIsAnalyzing(false);
    }
  }, [imageUri, existingItem]);

  const handleAnalyze = async () => {
    if (!imageUri) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysis(null);

    try {
      const base64 = await fileToBase64(imageUri);
      const visionService = OpenAIVisionService.getInstance();
      const analysisResult = await visionService.analyzeClothingImage(`data:image/jpeg;base64,${base64}`);

      if (!analysisResult.analysis.isValidClothing) {
        setAnalysisError("Our AI couldn't detect a clear clothing item. Please try another photo.");
        Alert.alert(
          "Not a valid clothing item",
          "Our AI couldn't detect a clothing item in this photo. Please try another one.",
          [{ text: 'OK' }]
        );
        onCancel(); // Automatically close the form on invalid image
        return;
      }

      setAnalysis(analysisResult.analysis);
      setName(analysisResult.analysis.description || 'New Item');
      setCategory(analysisResult.analysis.category || 'tops');
      setSubcategory(analysisResult.analysis.subcategory || '');
      setColor(analysisResult.analysis.color || '');
      setBrand(analysisResult.analysis.brand || 'unknown');
      setTags(analysisResult.analysis.tags || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during analysis.';
      setAnalysisError(errorMessage);
      Alert.alert('Analysis Failed', errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddTag = () => {
    if (customTag && !tags.includes(customTag)) {
      setTags([...tags, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    const currentUser = await AuthService.getCurrentUser();
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to save items.');
      return;
    }

    if (!name || !category || !color) {
      Alert.alert('Missing Info', 'Please fill out all required fields.');
      return;
    }

    if (!analysis) {
        Alert.alert('Analysis Missing', 'Please wait for the AI analysis to complete before saving.');
        return;
    }

    const itemToSave: WardrobeItem = {
      id: existingItem?.id || new Date().toISOString(), // Temporary ID
      userId: currentUser.id,
      name,
      category,
      subcategory,
      color,
      brand,
      size,
      imageUrl: imageUri,
      tags: tags,
      isFavorite,
      wearCount,
      lastWorn,
      createdAt: existingItem?.createdAt || new Date(),
      updatedAt: new Date(),
      aiAnalysis: analysis,
      confidenceScore: analysis.confidence || 0.8,
      colorAnalysis: {
        primaryColor: analysis.color || '#000000',
        secondaryColors: [],
        colorFamily: 'neutral',
        seasonality: [analysis.season || 'All-Season'],
        skinToneCompatibility: [],
      },
      weatherCompatibility: {
        temperatureRange: { min: 10, max: 20 },
        weatherConditions: ['any'],
        seasonality: [analysis.season || 'All-Season'],
      },
    };

    onSave(itemToSave);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{existingItem ? 'Edit Item' : 'Add to Wardrobe'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          {isAnalyzing && (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loaderText}>Analyzing your item...</Text>
            </View>
          )}
        </View>
        
        {analysisError && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={24} color={Colors.error} />
            <Text style={styles.errorText}>{analysisError}</Text>
          </View>
        )}

        <View style={styles.form}>
          <Text style={styles.label}>Name*</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Classic Denim Jacket"
            placeholderTextColor={Colors.textSecondary}
          />

          <Text style={styles.label}>Category*</Text>
          <View style={styles.categoryContainer}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  category === cat && styles.categoryChipSelected
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[
                  styles.categoryChipText,
                  category === cat && styles.categoryChipTextSelected
                ]}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Subcategory</Text>
          <TextInput
            style={styles.input}
            value={subcategory}
            onChangeText={setSubcategory}
            placeholder="e.g., Jacket, T-Shirt, Jeans"
            placeholderTextColor={Colors.textSecondary}
          />

          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Color*</Text>
              <TextInput
                style={styles.input}
                value={color}
                onChangeText={setColor}
                placeholder="e.g., Blue, Black, Red"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Brand</Text>
              <TextInput
                style={styles.input}
                value={brand}
                onChangeText={setBrand}
                placeholder="e.g., Levi's"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
          </View>

          <Text style={styles.label}>Size</Text>
          <TextInput
            style={styles.input}
            value={size}
            onChangeText={setSize}
            placeholder="e.g., Medium, 42, 10"
            placeholderTextColor={Colors.textSecondary}
          />
          
          <Text style={styles.label}>Tags</Text>
          <View style={styles.tagsContainer}>
            {tags.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
                <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                  <Ionicons name="close-circle" size={16} color={Colors.background} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              value={customTag}
              onChangeText={setCustomTag}
              placeholder="Add a custom tag..."
              placeholderTextColor={Colors.textSecondary}
              onSubmitEditing={handleAddTag}
            />
            <TouchableOpacity style={styles.addTagButton} onPress={handleAddTag}>
                <Ionicons name="add" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Fixed bottom action buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={onCancel}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={20} color={Colors.textSecondary} />
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.saveButton,
            (!name || !category || !color || isAnalyzing) && styles.saveButtonDisabled
          ]} 
          onPress={handleSave}
          disabled={!name || !category || !color || isAnalyzing}
          activeOpacity={0.8}
        >
          {isAnalyzing ? (
            <>
              <ActivityIndicator size="small" color={Colors.text} />
              <Text style={styles.saveButtonText}>Analyzing...</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color={Colors.text} />
              <Text style={styles.saveButtonText}>
                {existingItem ? 'Update' : 'Save to Wardrobe'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
    padding: 20,
    paddingTop: 25,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.backgroundCard,
  },
  headerSpacer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  image: {
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: 12,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loaderText: {
    color: Colors.text,
    marginTop: 10,
    fontWeight: 'bold',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  errorText: {
    color: Colors.text,
    marginLeft: 10,
    flex: 1,
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.backgroundCard,
    color: Colors.text,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryChip: {
    backgroundColor: Colors.backgroundCard,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  categoryChipSelected: {
    backgroundColor: Colors.primary,
  },
  categoryChipText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  categoryChipTextSelected: {
    color: Colors.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    flex: 1,
    marginRight: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: Colors.background,
    fontWeight: 'bold',
    marginRight: 6,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: 8,
  },
  tagInput: {
    flex: 1,
    color: Colors.text,
    padding: 12,
    fontSize: 16,
  },
  addTagButton: {
    padding: 10,
    backgroundColor: Colors.primary,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.textTertiary,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: Colors.text,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
}); 