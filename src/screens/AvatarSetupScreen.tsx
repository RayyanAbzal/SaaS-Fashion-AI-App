// Avatar Setup Screen - Body type selection and measurements
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { AvatarService } from '../services/avatarService';
import { UserAvatar } from '../services/enhancedOracleService';
import { useAvatar } from '../contexts/AvatarContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type AvatarSetupScreenProps = NativeStackScreenProps<RootStackParamList, 'AvatarSetup'>;

function AvatarSetupScreen({ navigation, route }: AvatarSetupScreenProps) {
  const { setUserAvatar } = useAvatar();
  const [currentStep, setCurrentStep] = useState(1);
  const [bodyType, setBodyType] = useState<'pear' | 'apple' | 'hourglass' | 'rectangle' | null>(null);
  const [measurements, setMeasurements] = useState({
    height: '',
    weight: '',
    waist: '',
  });
  const [fitPreferences, setFitPreferences] = useState({
    preferredFit: 'comfortable' as 'snug' | 'comfortable' | 'loose',
    problemAreas: [] as string[],
  });

  const bodyTypes = [
    {
      type: 'pear' as const,
      name: 'Pear',
      description: 'Hips wider than bust and waist',
      characteristics: ['Wider hips', 'Narrower shoulders', 'Defined waist'],
    },
    {
      type: 'apple' as const,
      name: 'Apple',
      description: 'Waist and bust similar, wider than hips',
      characteristics: ['Broader shoulders', 'Fuller bust', 'Less defined waist'],
    },
    {
      type: 'hourglass' as const,
      name: 'Hourglass',
      description: 'Bust and hips similar, smaller waist',
      characteristics: ['Balanced bust and hips', 'Defined waist', 'Curvy silhouette'],
    },
    {
      type: 'rectangle' as const,
      name: 'Rectangle',
      description: 'Bust, waist, and hips similar',
      characteristics: ['Straight silhouette', 'Minimal waist definition', 'Balanced proportions'],
    },
  ];

  const problemAreas = [
    'Waist too tight',
    'Hips too tight',
    'Length too short',
    'Length too long',
    'Shoulders too tight',
    'Sleeves too short',
  ];

  const handleBodyTypeSelect = (type: 'pear' | 'apple' | 'hourglass' | 'rectangle') => {
    setBodyType(type);
    setCurrentStep(2);
  };

  const handleMeasurementChange = (field: string, value: string) => {
    setMeasurements(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProblemAreaToggle = (area: string) => {
    setFitPreferences(prev => ({
      ...prev,
      problemAreas: prev.problemAreas.includes(area)
        ? prev.problemAreas.filter(a => a !== area)
        : [...prev.problemAreas, area],
    }));
  };

  const handleCreateAvatar = () => {
    if (!bodyType) {
      Alert.alert('Error', 'Please select your body type');
      return;
    }

    const height = parseFloat(measurements.height);
    const weight = parseFloat(measurements.weight);
    const waist = parseFloat(measurements.waist);

    if (!height || !weight || !waist) {
      Alert.alert('Error', 'Please fill in all measurements');
      return;
    }

    const avatar = AvatarService.createAvatar(
      { height, weight, waist },
      { bodyType, ...fitPreferences }
    );

    setUserAvatar(avatar);
    Alert.alert('Avatar Created!', 'Your personal styling assistant is ready to help you find the perfect fits!');
    navigation.goBack();
  };

  const renderBodyTypeSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What's your body type?</Text>
      <Text style={styles.stepDescription}>
        This helps us recommend the best fits for you
      </Text>

      <View style={styles.bodyTypeGrid}>
        {bodyTypes.map((type) => (
          <TouchableOpacity
            key={type.type}
            style={[
              styles.bodyTypeCard,
              bodyType === type.type && styles.bodyTypeCardSelected,
            ]}
            onPress={() => handleBodyTypeSelect(type.type)}
          >
            <Text style={styles.bodyTypeName}>{type.name}</Text>
            <Text style={styles.bodyTypeDescription}>{type.description}</Text>
            <View style={styles.characteristicsList}>
              {type.characteristics.map((char, index) => (
                <Text key={index} style={styles.characteristic}>
                  • {char}
                </Text>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMeasurements = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Your measurements</Text>
      <Text style={styles.stepDescription}>
        We only need your height, weight, and waist size for accurate fit predictions
      </Text>

      <View style={styles.measurementsForm}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Height (cm)</Text>
          <TextInput
            style={styles.input}
            value={measurements.height}
            onChangeText={(value) => handleMeasurementChange('height', value)}
            placeholder="165"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Weight (lbs)</Text>
          <TextInput
            style={styles.input}
            value={measurements.weight}
            onChangeText={(value) => handleMeasurementChange('weight', value)}
            placeholder="140"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Waist (inches)</Text>
          <TextInput
            style={styles.input}
            value={measurements.waist}
            onChangeText={(value) => handleMeasurementChange('waist', value)}
            placeholder="28"
            keyboardType="numeric"
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => setCurrentStep(3)}
      >
        <Text style={styles.nextButtonText}>Next</Text>
        <Ionicons name="arrow-forward" size={20} color={Colors.background} />
      </TouchableOpacity>
    </View>
  );

  const renderFitPreferences = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Fit preferences</Text>
      <Text style={styles.stepDescription}>
        Help us understand your comfort preferences
      </Text>

      <View style={styles.preferencesSection}>
        <Text style={styles.sectionTitle}>Preferred fit</Text>
        <View style={styles.fitOptions}>
          {['snug', 'comfortable', 'loose'].map((fit) => (
            <TouchableOpacity
              key={fit}
              style={[
                styles.fitOption,
                fitPreferences.preferredFit === fit && styles.fitOptionSelected,
              ]}
              onPress={() => setFitPreferences(prev => ({ ...prev, preferredFit: fit as any }))}
            >
              <Text style={[
                styles.fitOptionText,
                fitPreferences.preferredFit === fit && styles.fitOptionTextSelected,
              ]}>
                {fit.charAt(0).toUpperCase() + fit.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.preferencesSection}>
        <Text style={styles.sectionTitle}>Problem areas (optional)</Text>
        <Text style={styles.sectionDescription}>
          Select areas where you often have fit issues
        </Text>
        <View style={styles.problemAreasGrid}>
          {problemAreas.map((area) => (
            <TouchableOpacity
              key={area}
              style={[
                styles.problemAreaChip,
                fitPreferences.problemAreas.includes(area) && styles.problemAreaChipSelected,
              ]}
              onPress={() => handleProblemAreaToggle(area)}
            >
              <Text style={[
                styles.problemAreaText,
                fitPreferences.problemAreas.includes(area) && styles.problemAreaTextSelected,
              ]}>
                {area}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreateAvatar}
      >
        <Text style={styles.createButtonText}>Create My Avatar</Text>
        <Ionicons name="checkmark" size={20} color={Colors.background} />
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
        <Text style={styles.headerTitle}>Create Your Avatar</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressStep, currentStep >= 1 && styles.progressStepActive]} />
        <View style={[styles.progressStep, currentStep >= 2 && styles.progressStepActive]} />
        <View style={[styles.progressStep, currentStep >= 3 && styles.progressStepActive]} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderBodyTypeSelection()}
        {currentStep === 2 && renderMeasurements()}
        {currentStep === 3 && renderFitPreferences()}
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
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  progressBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 32,
    lineHeight: 24,
  },
  bodyTypeGrid: {
    gap: 16,
  },
  bodyTypeCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bodyTypeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  bodyTypeIcon: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 12,
  },
  bodyTypeName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  bodyTypeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  characteristicsList: {
    gap: 4,
  },
  characteristic: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  measurementsForm: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
  preferencesSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  fitOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  fitOption: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  fitOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  fitOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  fitOptionTextSelected: {
    color: Colors.primary,
  },
  problemAreasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  problemAreaChip: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  problemAreaChipSelected: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary,
  },
  problemAreaText: {
    fontSize: 12,
    color: Colors.text,
  },
  problemAreaTextSelected: {
    color: Colors.primary,
    fontWeight: '500',
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
});

export default AvatarSetupScreen;
