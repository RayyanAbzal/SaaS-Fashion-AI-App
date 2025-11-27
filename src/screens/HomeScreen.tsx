import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import { useUser } from '../contexts/UserContext';
import { RootStackParamList } from '../types';
import { OutfitCombination } from '../services/oracleService';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useUser();
  const [wardrobeCount, setWardrobeCount] = useState(0);
  const [currentOutfit, setCurrentOutfit] = useState<OutfitCombination | null>(null);

  useEffect(() => {
    // Simple initialization - we'll add real data later
    setWardrobeCount(12); // Mock data for now
  }, []);



  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.greeting}>
              {new Date().getHours() < 12 ? 'Morning' : 
               new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.displayName?.split(' ')[0] || 'there'}!
            </Text>
            <View style={styles.weatherContainer}>
              <Ionicons name="partly-sunny" size={20} color={Colors.primary} />
              <Text style={styles.weatherText}>22°</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Your personal AI stylist for every fashion decision</Text>
        </View>


        {/* AI Stylist Features */}
        <View style={styles.mainActions}>
          {/* Feature 1: Ask AI Stylist (Main Feature) */}
          <TouchableOpacity
            style={[styles.mainActionButton, styles.primaryAction]}
            onPress={() => navigation.navigate('StyleSwipe', {})}
          >
            <View style={styles.actionContent}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="sparkles" size={32} color={Colors.text} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Ask AI Stylist</Text>
                <Text style={styles.actionSubtitle}>
                  Get personalized outfit advice and feedback
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={Colors.text} />
            </View>
          </TouchableOpacity>

          {/* Feature 2: Style Check */}
          <TouchableOpacity
            style={styles.mainActionButton}
            onPress={() => navigation.navigate('StyleCheck', {})}
          >
            <View style={styles.actionContent}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="camera" size={28} color={Colors.primary} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Style Check</Text>
                <Text style={styles.actionSubtitle}>
                  Take a photo for instant styling feedback
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>

          {/* Feature 3: Find Similar Items */}
          <TouchableOpacity
            style={styles.mainActionButton}
            onPress={() => navigation.navigate('PinterestBoard', {})}
          >
            <View style={styles.actionContent}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="search" size={28} color={Colors.primary} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Find Similar Items</Text>
                <Text style={styles.actionSubtitle}>
                  Upload Pinterest image to find similar clothes
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>

          {/* Feature 4: Pinterest Style Analysis */}
          <TouchableOpacity
            style={styles.mainActionButton}
            onPress={() => navigation.navigate('PinterestStyle', {})}
          >
            <View style={styles.actionContent}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="pinterest" size={28} color={Colors.primary} />
              </View>
              <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Enhance with Pinterest</Text>
              <Text style={styles.actionSubtitle}>
                Optional: Get even more personalized recommendations
              </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>


        {/* Simple Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{wardrobeCount}</Text>
            <Text style={styles.statLabel}>Items in Wardrobe</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Store Items Available</Text>
          </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  weatherText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  mainActions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  enhancedFeatures: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  enhancedActionButton: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mainActionButton: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryAction: {
    backgroundColor: Colors.primary,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  weatherContext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    marginHorizontal: 5,
    paddingVertical: 16,
    borderRadius: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    minWidth: 100,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
  avatarButtonActive: {
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  avatarTextActive: {
    color: Colors.success,
    fontWeight: '600',
  },
  // Outfit Display Styles
  outfitDisplayContainer: {
    backgroundColor: Colors.backgroundCard,
    margin: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  outfitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  oracleIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  outfitHeaderText: {
    flex: 1,
  },
  oracleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  confidence: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  outfitItemsScroll: {
    marginBottom: 20,
  },
  outfitItemsContainer: {
    paddingRight: 20,
  },
  outfitItem: {
    width: 120,
    marginRight: 15,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  outfitItemImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  outfitItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  outfitItemBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outfitItemName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  outfitItemDetails: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  outfitItemBrand: {
    fontSize: 10,
    color: Colors.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  outfitItemPrice: {
    fontSize: 10,
    color: Colors.accent,
    textAlign: 'center',
    fontWeight: '600',
  },
  outfitSummary: {
    marginBottom: 20,
  },
  outfitSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  outfitSummaryText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 15,
  },
  whyItWorksContainer: {
    gap: 8,
  },
  whyItWorksItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  whyItWorksText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  outfitActions: {
    flexDirection: 'row',
    gap: 15,
  },
  outfitTryAgainButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    gap: 8,
  },
  outfitTryAgainText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  outfitWearButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    gap: 8,
  },
  outfitWearText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  outfitSwiperContainer: {
    flex: 1,
    marginTop: 20,
  },
}); 