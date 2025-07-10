import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { CameraPhoto } from '../types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type CameraScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Camera'>;

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<CameraPhoto | null>(null);
  const navigation = useNavigation<CameraScreenNavigationProp>();

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const cameraPhoto: CameraPhoto = {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          base64: asset.base64 || undefined,
        };
        setCapturedImage(cameraPhoto);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const cameraPhoto: CameraPhoto = {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        base64: asset.base64 || undefined,
      };
      setCapturedImage(cameraPhoto);
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
  };

  const handleCapture = async () => {
    if (capturedImage) {
      (navigation as any).navigate('Wardrobe', { capturedImageUri: capturedImage.uri });
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="camera" size={80} color={Colors.textSecondary} />
          <Text style={styles.permissionText}>No access to camera</Text>
          <Text style={styles.permissionSubtext}>
            Please enable camera permissions in your device settings
          </Text>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (capturedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage.uri }} style={styles.preview} />
          <View style={styles.previewButtons}>
            <TouchableOpacity style={styles.previewButton} onPress={retakePicture}>
              <Ionicons name="refresh" size={24} color={Colors.text} />
              <Text style={styles.previewButtonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.previewButton, styles.saveButton]} onPress={handleCapture}>
              <Ionicons name="checkmark" size={24} color={Colors.text} />
              <Text style={styles.previewButtonText}>Use Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleCancel}>
            <Ionicons name="close" size={40} color="white" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Take Photo</Text>
      </View>
      
      <View style={styles.cameraContainer}>
        <View style={styles.cameraPlaceholder}>
          <Ionicons name="camera" size={120} color={Colors.textSecondary} />
          <Text style={styles.cameraPlaceholderText}>Camera</Text>
          <Text style={styles.cameraPlaceholderSubtext}>Tap the button below to take a photo</Text>
        </View>
        
        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <Ionicons name="camera" size={40} color={Colors.text} />
            <Text style={styles.captureButtonText}>Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
            <Ionicons name="images" size={24} color={Colors.text} />
            <Text style={styles.galleryButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  permissionText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 20,
  },
  permissionSubtext: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  cameraPlaceholder: {
    alignItems: 'center',
    marginBottom: 30,
  },
  cameraPlaceholderText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 10,
  },
  cameraPlaceholderSubtext: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 5,
  },
  cameraControls: {
    width: '100%',
    alignItems: 'center',
  },
  captureButton: {
    width: '100%',
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  captureButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 10,
  },
  galleryButton: {
    width: '100%',
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  galleryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 10,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  preview: {
    flex: 1,
    width: '100%',
  },
  previewButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: Colors.background,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: Colors.backgroundCard,
    minWidth: 120,
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  previewButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.backgroundCard,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 