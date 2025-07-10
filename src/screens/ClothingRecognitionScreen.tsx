import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '@/constants/colors';
import { analyzeClothingPhoto, validatePhotoQuality, ClothingItem, RecognitionResult } from '@/services/clothingRecognitionService';
import { CameraPhoto } from '@/types';

export default function ClothingRecognitionScreen() {
  const navigation = useNavigation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedItems, setSelectedItems] = useState<ClothingItem[]>([]);

  const handleClose = () => {
    navigation.goBack();
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('Camera result URI:', result.assets[0].uri);
        const photo: CameraPhoto = {
          uri: result.assets[0].uri,
          width: result.assets[0].width || 800,
          height: result.assets[0].height || 600,
        };

        setSelectedImage(photo.uri);
        await analyzePhoto(photo);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Photo library permission is required to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('Gallery result URI:', result.assets[0].uri);
        const photo: CameraPhoto = {
          uri: result.assets[0].uri,
          width: result.assets[0].width || 800,
          height: result.assets[0].height || 600,
        };

        setSelectedImage(photo.uri);
        await analyzePhoto(photo);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const analyzePhoto = async (photo: CameraPhoto) => {
    setIsProcessing(true);
    setRecognitionResult(null);
    setSelectedItems([]);

    try {
      // Validate photo quality
      const qualityCheck = validatePhotoQuality(photo);
      if (!qualityCheck.isValid) {
        Alert.alert('Photo Quality Issue', qualityCheck.issues.join('\n'));
        setIsProcessing(false);
        return;
      }

      // Analyze the photo
      const result = await analyzeClothingPhoto(photo);
      setRecognitionResult(result);
    } catch (error) {
      console.error('Error analyzing photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      Alert.alert('Analysis Failed', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleItemSelection = (item: ClothingItem) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(selected => selected.id === item.id);
      if (isSelected) {
        return prev.filter(selected => selected.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const addSelectedItemsToWardrobe = () => {
    if (selectedItems.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to add to your wardrobe.');
      return;
    }

    // TODO: Add items to wardrobe service
    Alert.alert(
      'Success!',
      `Added ${selectedItems.length} item(s) to your wardrobe.`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const renderClothingItem = (item: ClothingItem) => {
    const isSelected = selectedItems.some(selected => selected.id === item.id);
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.itemCard, isSelected && styles.selectedItemCard]}
        onPress={() => toggleItemSelection(item)}
      >
        <View style={styles.itemImageContainer}>
          <View style={[styles.itemImage, { backgroundColor: item.color }]}>
            <Text style={styles.itemImageText}>{item.name}</Text>
          </View>
        </View>
        
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemCategory}>
            {item.category} • {item.subcategory}
          </Text>
          <Text style={styles.itemColor}>Color: {item.color}</Text>
          <Text style={styles.itemConfidence}>
            Confidence: {Math.round(item.confidence * 100)}%
          </Text>
        </View>

        <View style={styles.selectionIndicator}>
          <Ionicons
            name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={isSelected ? Colors.success : Colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clothing Recognition</Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!selectedImage ? (
          <View style={styles.uploadSection}>
            <View style={styles.uploadCard}>
              <Ionicons name="camera" size={64} color={Colors.primary} />
              <Text style={styles.uploadTitle}>Identify Clothing Items</Text>
              <Text style={styles.uploadDescription}>
                Take a photo or select an image to automatically identify and categorize clothing items
              </Text>
              
              <View style={styles.uploadButtons}>
                <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                  <Ionicons name="camera" size={20} color={Colors.text} />
                  <Text style={styles.uploadButtonText}>Take Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                  <Ionicons name="images" size={20} color={Colors.text} />
                  <Text style={styles.uploadButtonText}>Choose Photo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.resultsSection}>
            <View style={styles.imagePreview}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              <TouchableOpacity style={styles.retakeButton} onPress={() => setSelectedImage(null)}>
                <Ionicons name="refresh" size={20} color={Colors.text} />
                <Text style={styles.retakeButtonText}>Retake</Text>
              </TouchableOpacity>
            </View>

            {isProcessing && (
              <View style={styles.processingContainer}>
                <Text style={styles.processingText}>Analyzing your photo...</Text>
              </View>
            )}

            {recognitionResult && (
              <View style={styles.resultsContainer}>
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsTitle}>
                    Found {recognitionResult.totalItems} items
                  </Text>
                  <Text style={styles.resultsSubtitle}>
                    Processing time: {recognitionResult.processingTime}s
                  </Text>
                </View>

                <View style={styles.itemsList}>
                  {recognitionResult.items.map(renderClothingItem)}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Fixed bottom save button */}
      {recognitionResult && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              selectedItems.length === 0 && styles.saveButtonDisabled
            ]}
            onPress={addSelectedItemsToWardrobe}
            disabled={selectedItems.length === 0}
          >
            <Ionicons 
              name="save" 
              size={20} 
              color={selectedItems.length === 0 ? Colors.textSecondary : Colors.text} 
            />
            <Text style={[
              styles.saveButtonText,
              selectedItems.length === 0 && styles.saveButtonTextDisabled
            ]}>
              {selectedItems.length === 0 
                ? 'Select items to save' 
                : `Save ${selectedItems.length} item(s) to Wardrobe`
              }
            </Text>
          </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundGlass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  uploadSection: {
    padding: 20,
  },
  uploadCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  uploadTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  uploadDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  resultsSection: {
    padding: 20,
  },
  imagePreview: {
    position: 'relative',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    backgroundColor: Colors.backgroundGlass,
  },
  retakeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundGlass,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  retakeButtonText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  processingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  processingText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  resultsContainer: {
    gap: 20,
  },
  resultsHeader: {
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  resultsSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedItemCard: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundGlass,
  },
  itemImageContainer: {
    marginRight: 16,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImageText: {
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  itemColor: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  itemConfidence: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  selectionIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.backgroundGlass,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  saveButtonTextDisabled: {
    color: Colors.textSecondary,
  },
}); 