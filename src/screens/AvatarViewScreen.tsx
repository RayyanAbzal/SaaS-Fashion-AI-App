// Avatar View Screen - View and update avatar details
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import { useAvatar } from '../contexts/AvatarContext';
import { RootStackParamList } from '../types';

type AvatarViewScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AvatarViewScreen() {
  const navigation = useNavigation<AvatarViewScreenNavigationProp>();
  const { userAvatar, hasAvatar } = useAvatar();

  const handleUpdateAvatar = () => {
    navigation.navigate('AvatarSetup');
  };

  const handleTestSizing = () => {
    Alert.alert(
      'Test Sizing',
      'This feature will show you how different clothing items would fit on your avatar based on your measurements.',
      [
        { text: 'Go to Style Swipe', onPress: () => navigation.navigate('StyleSwipe') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  if (!hasAvatar || !userAvatar) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Avatar</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.noAvatarContainer}>
          <Ionicons name="person-outline" size={80} color={Colors.backgroundSecondary} />
          <Text style={styles.noAvatarTitle}>No Avatar Created</Text>
          <Text style={styles.noAvatarDescription}>
            Create your avatar to get personalized fit predictions and styling recommendations.
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('AvatarSetup')}
          >
            <Ionicons name="add" size={20} color={Colors.text} />
            <Text style={styles.createButtonText}>Create Avatar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Avatar</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleUpdateAvatar}
        >
          <Ionicons name="create" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Avatar Preview */}
        <View style={styles.avatarPreview}>
          <View style={styles.avatarFigure}>
            <Ionicons name="person" size={100} color={Colors.primary} />
          </View>
          <Text style={styles.avatarTitle}>Your Virtual Avatar</Text>
          <Text style={styles.avatarSubtitle}>
            {userAvatar.bodyType.charAt(0).toUpperCase() + userAvatar.bodyType.slice(1)} Body Type
          </Text>
        </View>

        {/* Measurements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Measurements</Text>
          <View style={styles.measurementsGrid}>
            <View style={styles.measurementItem}>
              <Text style={styles.measurementLabel}>Height</Text>
              <Text style={styles.measurementValue}>{userAvatar.measurements.height} cm</Text>
            </View>
            <View style={styles.measurementItem}>
              <Text style={styles.measurementLabel}>Weight</Text>
              <Text style={styles.measurementValue}>{userAvatar.measurements.weight} lbs</Text>
            </View>
            <View style={styles.measurementItem}>
              <Text style={styles.measurementLabel}>Waist</Text>
              <Text style={styles.measurementValue}>{userAvatar.measurements.waist} inches</Text>
            </View>
          </View>
        </View>

        {/* Fit Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fit Preferences</Text>
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Preferred Fit</Text>
            <Text style={styles.preferenceValue}>
              {userAvatar.fitPreferences.preferredFit.charAt(0).toUpperCase() + 
               userAvatar.fitPreferences.preferredFit.slice(1)}
            </Text>
          </View>
          {userAvatar.fitPreferences.problemAreas.length > 0 && (
            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Problem Areas</Text>
              <Text style={styles.preferenceValue}>
                {userAvatar.fitPreferences.problemAreas.join(', ')}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleUpdateAvatar}
          >
            <Ionicons name="create" size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Update Measurements</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.primaryAction]}
            onPress={handleTestSizing}
          >
            <Ionicons name="shirt" size={20} color={Colors.text} />
            <Text style={[styles.actionButtonText, styles.primaryActionText]}>Test Sizing</Text>
          </TouchableOpacity>
        </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  editButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  noAvatarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  noAvatarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  noAvatarDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  avatarPreview: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 30,
    marginBottom: 20,
  },
  avatarFigure: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  avatarSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  section: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  measurementsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  measurementItem: {
    alignItems: 'center',
    flex: 1,
  },
  measurementLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  measurementValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  preferenceItem: {
    marginBottom: 12,
  },
  preferenceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  preferenceValue: {
    fontSize: 16,
    color: Colors.text,
  },
  actions: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  primaryAction: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  primaryActionText: {
    color: Colors.text,
  },
});
