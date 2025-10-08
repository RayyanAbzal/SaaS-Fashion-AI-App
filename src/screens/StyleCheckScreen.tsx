import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { StyleAdviceService } from '../services/styleAdviceService';

export default function StyleCheckScreen() {
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [styleAdvice, setStyleAdvice] = useState<any>(null);
  const [showAdvice, setShowAdvice] = useState(false);
  const [skinTone, setSkinTone] = useState<'fair' | 'medium' | 'deep' | undefined>(undefined);

  const pickFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera permission is needed to take a photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        if (asset.base64) {
          setLoading(true);
          setShowAdvice(false);
          const advice = await StyleAdviceService.analyzeOutfitBase64(asset.base64, { skinTone });
          setStyleAdvice(advice);
          setShowAdvice(true);
          setLoading(false);
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Library permission is needed to choose a photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        if (asset.base64) {
          setLoading(true);
          setShowAdvice(false);
          const advice = await StyleAdviceService.analyzeOutfitBase64(asset.base64, { skinTone });
          setStyleAdvice(advice);
          setShowAdvice(true);
          setLoading(false);
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to choose photo');
    }
  };

  const handleTakePhoto = () => {
    Alert.alert(
      'Take Style Photo',
      'Take a photo of your outfit for instant styling feedback:',
      [
        { text: 'Take Photo', onPress: pickFromCamera },
        { text: 'Choose from Gallery', onPress: pickFromGallery },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleAnalyzeStyle = async (imageUri: string) => {
    try {
      setLoading(true);
      setShowAdvice(false);
      
      const advice = await StyleAdviceService.analyzeOutfit(imageUri, { skinTone });
      setStyleAdvice(advice);
      setShowAdvice(true);
      
    } catch (error) {
      console.error('Error analyzing style:', error);
      Alert.alert('Error', 'Failed to analyze your outfit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetAdvice = () => {
    if (selectedImage) {
      handleAnalyzeStyle(selectedImage);
    } else {
      handleTakePhoto();
    }
  };

  const renderStyleAdvice = () => {
    if (!styleAdvice) return null;

    return (
      <View style={styles.adviceContainer}>
        <View style={styles.adviceHeader}>
          <Text style={styles.adviceTitle}>Style Analysis</Text>
          
          {/* Show both /10 score and stars */}
          <View style={styles.ratingContainer}>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreNumber}>{styleAdvice.overallRating10 || styleAdvice.overallRating * 2}</Text>
              <Text style={styles.scoreOutOf}>/10</Text>
            </View>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= styleAdvice.overallRating ? "star" : "star-outline"}
                  size={18}
                  color={star <= styleAdvice.overallRating ? Colors.accent : Colors.backgroundSecondary}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.adviceContent}>
          <Text style={styles.adviceText}>{styleAdvice.overallFeedback}</Text>
          
          {styleAdvice.suggestions && styleAdvice.suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Suggestions:</Text>
              {styleAdvice.suggestions.map((suggestion: string, index: number) => (
                <View key={index} style={styles.suggestionItem}>
                  <Ionicons name="bulb" size={16} color={Colors.accent} />
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </View>
              ))}
            </View>
          )}

          {styleAdvice.compliments && styleAdvice.compliments.length > 0 && (
            <View style={styles.complimentsContainer}>
              <Text style={styles.complimentsTitle}>What's Working:</Text>
              {styleAdvice.compliments.map((compliment: string, index: number) => (
                <View key={index} style={styles.complimentItem}>
                  <Ionicons name="heart" size={16} color={Colors.primary} />
                  <Text style={styles.complimentText}>{compliment}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.occasionContainer}>
            <Text style={styles.occasionTitle}>Perfect For:</Text>
            <View style={styles.occasionTags}>
              {styleAdvice.occasions.map((occasion: string, index: number) => (
                <View key={index} style={styles.occasionTag}>
                  <Text style={styles.occasionTagText}>{occasion}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Style Check</Text>
        <Text style={styles.headerSubtitle}>
          Get instant feedback on your outfit from your AI stylist
        </Text>
        
        {/* Skin tone selector */}
        <View style={styles.skinToneContainer}>
          <Text style={styles.skinToneLabel}>Skin tone (optional):</Text>
          <View style={styles.skinToneOptions}>
            {(['fair', 'medium', 'deep'] as const).map((tone) => (
              <TouchableOpacity
                key={tone}
                style={[
                  styles.skinToneOption,
                  skinTone === tone && styles.skinToneOptionSelected
                ]}
                onPress={() => setSkinTone(skinTone === tone ? undefined : tone)}
              >
                <Text style={[
                  styles.skinToneOptionText,
                  skinTone === tone && styles.skinToneOptionTextSelected
                ]}>
                  {tone.charAt(0).toUpperCase() + tone.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!selectedImage ? (
          <View style={styles.uploadContainer}>
            <View style={styles.uploadIcon}>
              <Ionicons name="camera" size={60} color={Colors.primary} />
            </View>
            <Text style={styles.uploadTitle}>Take a Style Photo</Text>
            <Text style={styles.uploadSubtitle}>
              Upload a photo of your outfit for personalized styling advice
            </Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleTakePhoto}
            >
              <Ionicons name="camera" size={24} color={Colors.text} />
              <Text style={styles.uploadButtonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoContainer}>
            <Image source={{ uri: selectedImage }} style={styles.photo} />
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={handleTakePhoto}
            >
              <Ionicons name="refresh" size={20} color={Colors.text} />
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Analyzing your style...</Text>
          </View>
        ) : showAdvice ? (
          renderStyleAdvice()
        ) : selectedImage ? (
          <TouchableOpacity
            style={styles.analyzeButton}
            onPress={handleGetAdvice}
          >
            <Ionicons name="sparkles" size={24} color={Colors.text} />
            <Text style={styles.analyzeButtonText}>Get Style Advice</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  content: {
    flex: 1,
  },
  uploadContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  uploadIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  photoContainer: {
    alignItems: 'center',
    padding: 20,
  },
  photo: {
    width: 300,
    height: 300,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 20,
    gap: 6,
  },
  changePhotoText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    margin: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  adviceContainer: {
    margin: 20,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 20,
  },
  adviceHeader: {
    marginBottom: 20,
  },
  adviceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  scoreOutOf: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginLeft: 2,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  skinToneContainer: {
    marginTop: 16,
  },
  skinToneLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  skinToneOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  skinToneOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skinToneOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  skinToneOptionText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  skinToneOptionTextSelected: {
    color: Colors.text,
    fontWeight: '600',
  },
  adviceContent: {
    gap: 16,
  },
  adviceText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  suggestionsContainer: {
    gap: 8,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
  complimentsContainer: {
    gap: 8,
  },
  complimentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  complimentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  complimentText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
  occasionContainer: {
    gap: 8,
  },
  occasionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  occasionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  occasionTag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  occasionTagText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
});
