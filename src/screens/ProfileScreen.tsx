import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { AuthService } from '../services/authService';
import { FirestoreService } from '../services/firestoreService';
import { User, Achievement, MainTabParamList } from '../types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUser } from '../contexts/UserContext';
import { RootStackParamList } from '../types';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [preferenceStats, setPreferenceStats] = useState<{
    totalInteractions: number;
    likes: number;
    dislikes: number;
    favoriteCategories: string[];
    favoriteColors: string[];
    favoriteBrands: string[];
  } | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [learningProgress, setLearningProgress] = useState<{
    totalInteractions: number;
    categoryScores: Record<string, number>;
    colorScores: Record<string, number>;
    brandScores: Record<string, number>;
    recentInteractions: Array<{action: string, items: string[], timestamp: Date}>;
  } | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signOut } = useUser();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => { /* Navigate to Settings */ }} style={{ marginRight: 15 }}>
          <Ionicons name="settings-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
      
      // Load preference statistics if user exists
      if (currentUser?.id) {
        const stats = await FirestoreService.getUserPreferenceStats(currentUser.id);
        setPreferenceStats(stats);
        
        // Load detailed learning progress for debug mode
        await loadLearningProgress(currentUser.id);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const handleBrandSelection = () => {
    navigation.navigate('BrandSelection');
  };

  const handleAchievements = () => {
    navigation.navigate('Achievements');
  };

  const loadLearningProgress = async (userId: string) => {
    try {
      const preferences = await FirestoreService.loadUserPreferences(userId);
      
      // Calculate category scores
      const categoryScores: Record<string, { likes: number; total: number }> = {};
      const colorScores: Record<string, { likes: number; total: number }> = {};
      const brandScores: Record<string, { likes: number; total: number }> = {};
      
      preferences.forEach(pref => {
        // Category scores
        if (!categoryScores[pref.category]) {
          categoryScores[pref.category] = { likes: 0, total: 0 };
        }
        categoryScores[pref.category].total++;
        if (pref.preference === 'like') {
          categoryScores[pref.category].likes++;
        }
        
        // Color scores
        if (!colorScores[pref.color]) {
          colorScores[pref.color] = { likes: 0, total: 0 };
        }
        colorScores[pref.color].total++;
        if (pref.preference === 'like') {
          colorScores[pref.color].likes++;
        }
        
        // Brand scores
        if (!brandScores[pref.brand]) {
          brandScores[pref.brand] = { likes: 0, total: 0 };
        }
        brandScores[pref.brand].total++;
        if (pref.preference === 'like') {
          brandScores[pref.brand].likes++;
        }
      });
      
      // Convert to percentages
      const categoryPercentages: Record<string, number> = {};
      Object.keys(categoryScores).forEach(category => {
        const score = categoryScores[category];
        categoryPercentages[category] = score.total > 0 ? (score.likes / score.total) * 100 : 0;
      });
      
      const colorPercentages: Record<string, number> = {};
      Object.keys(colorScores).forEach(color => {
        const score = colorScores[color];
        colorPercentages[color] = score.total > 0 ? (score.likes / score.total) * 100 : 0;
      });
      
      const brandPercentages: Record<string, number> = {};
      Object.keys(brandScores).forEach(brand => {
        const score = brandScores[brand];
        brandPercentages[brand] = score.total > 0 ? (score.likes / score.total) * 100 : 0;
      });
      
      // Get recent interactions
      const recentInteractions = preferences
        .slice(0, 10)
        .map(pref => ({
          action: pref.preference,
          items: [pref.category, pref.color, pref.brand],
          timestamp: pref.timestamp
        }));
      
      setLearningProgress({
        totalInteractions: preferences.length,
        categoryScores: categoryPercentages,
        colorScores: colorPercentages,
        brandScores: brandPercentages,
        recentInteractions
      });
      
    } catch (error) {
      console.error('Error loading learning progress:', error);
    }
  };

  const mockAchievements: Achievement[] = [
    {
      id: '1',
      userId: user?.id || '',
      type: 'streak',
      title: '7-Day Streak',
      description: 'Created outfits for 7 days in a row',
      icon: '🔥',
      unlockedAt: new Date(Date.now() - 86400000 * 3),
      progress: 7,
      maxProgress: 7,
    },
    {
      id: '2',
      userId: user?.id || '',
      type: 'style',
      title: 'Style Explorer',
      description: 'Tried 5 different style categories',
      icon: '🎨',
      unlockedAt: new Date(Date.now() - 86400000 * 7),
      progress: 5,
      maxProgress: 5,
    },
    {
      id: '3',
      userId: user?.id || '',
      type: 'social',
      title: 'Social Butterfly',
      description: 'Shared 10 outfits with friends',
      icon: '🦋',
      unlockedAt: new Date(Date.now() - 86400000 * 14),
      progress: 10,
      maxProgress: 10,
    },
  ];

  const renderAchievement = (achievement: Achievement) => (
    <View key={achievement.id} style={styles.achievementCard}>
      <View style={styles.achievementIcon}>
        <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
      </View>
      <View style={styles.achievementInfo}>
        <Text style={styles.achievementName}>{achievement.title}</Text>
        <Text style={styles.achievementDescription}>{achievement.description}</Text>
        <Text style={styles.achievementDate}>
          {achievement.unlockedAt.toLocaleDateString()}
        </Text>
      </View>
      <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(achievement.type) }]}>
        <Text style={styles.rarityText}>{achievement.type}</Text>
      </View>
    </View>
  );

  const getRarityColor = (type: string) => {
    switch (type) {
      case 'streak': return Colors.success;
      case 'style': return Colors.primary;
      case 'social': return Colors.accent;
      default: return Colors.textSecondary;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadUserData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                {user.photoURL ? (
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={40} color={Colors.text} />
                  </View>
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.displayName || 'New User'}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={styles.streakContainer}>
                  <Ionicons name="flame" size={16} color={Colors.accent} />
                  <Text style={styles.streakText}>7 day streak</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="shirt" size={24} color={Colors.text} />
              <Text style={styles.statNumber}>24</Text>
              <Text style={styles.statLabel}>Outfits</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="heart" size={24} color={Colors.text} />
              <Text style={styles.statNumber}>{preferenceStats?.likes || 0}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="star" size={24} color={Colors.text} />
              <Text style={styles.statNumber}>4.8</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={24} color={Colors.text} />
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Achievements</Text>
            </View>
          </View>
        </View>

        {preferenceStats && preferenceStats.totalInteractions > 0 && (
          <View style={styles.preferencesSection}>
            <Text style={styles.sectionTitle}>AI Learning Insights</Text>
            <View style={styles.preferencesCard}>
              <Text style={styles.preferencesSubtitle}>Based on your likes and dislikes:</Text>
              
              {preferenceStats.favoriteCategories.length > 0 && (
                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceLabel}>Favorite Categories:</Text>
                  <View style={styles.tagContainer}>
                    {preferenceStats.favoriteCategories.map((category, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{category}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              {preferenceStats.favoriteColors.length > 0 && (
                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceLabel}>Favorite Colors:</Text>
                  <View style={styles.tagContainer}>
                    {preferenceStats.favoriteColors.map((color, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{color}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              {preferenceStats.favoriteBrands.length > 0 && (
                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceLabel}>Favorite Brands:</Text>
                  <View style={styles.tagContainer}>
                    {preferenceStats.favoriteBrands.map((brand, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{brand}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              <View style={styles.preferenceStats}>
                <Text style={styles.preferenceStatsText}>
                  Total interactions: {preferenceStats.totalInteractions} • 
                  Likes: {preferenceStats.likes} • 
                  Dislikes: {preferenceStats.dislikes}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          {mockAchievements.map(renderAchievement)}
        </View>

        {debugMode && learningProgress && (
          <View style={styles.debugSection}>
            <Text style={styles.sectionTitle}>🧠 AI Learning Debug</Text>
            <View style={styles.debugCard}>
              <Text style={styles.debugSubtitle}>Total Interactions: {learningProgress.totalInteractions}</Text>
              
              {Object.keys(learningProgress.categoryScores).length > 0 && (
                <View style={styles.debugItem}>
                  <Text style={styles.debugLabel}>Category Preferences:</Text>
                  {Object.entries(learningProgress.categoryScores)
                    .sort(([,a], [,b]) => b - a)
                    .map(([category, score]) => (
                      <Text key={category} style={styles.debugScore}>
                        {category}: {score.toFixed(1)}% liked
                      </Text>
                    ))}
                </View>
              )}
              
              {Object.keys(learningProgress.colorScores).length > 0 && (
                <View style={styles.debugItem}>
                  <Text style={styles.debugLabel}>Color Preferences:</Text>
                  {Object.entries(learningProgress.colorScores)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([color, score]) => (
                      <Text key={color} style={styles.debugScore}>
                        {color}: {score.toFixed(1)}% liked
                      </Text>
                    ))}
                </View>
              )}
              
              {Object.keys(learningProgress.brandScores).length > 0 && (
                <View style={styles.debugItem}>
                  <Text style={styles.debugLabel}>Brand Preferences:</Text>
                  {Object.entries(learningProgress.brandScores)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([brand, score]) => (
                      <Text key={brand} style={styles.debugScore}>
                        {brand}: {score.toFixed(1)}% liked
                      </Text>
                    ))}
                </View>
              )}
              
              <View style={styles.debugItem}>
                <Text style={styles.debugLabel}>Recent Interactions:</Text>
                {learningProgress.recentInteractions.map((interaction, index) => (
                  <Text key={index} style={styles.debugInteraction}>
                    {interaction.action.toUpperCase()}: {interaction.items.join(', ')} 
                    ({interaction.timestamp.toLocaleDateString()})
                  </Text>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleBrandSelection}>
            <Ionicons name="shirt" size={20} color={Colors.text} />
            <Text style={styles.actionText}>Brand Preferences</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleAchievements}>
            <Ionicons name="trophy" size={20} color={Colors.text} />
            <Text style={styles.actionText}>Achievements</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setDebugMode(!debugMode)}
          >
            <Ionicons name="bug" size={20} color={Colors.text} />
            <Text style={styles.actionText}>AI Learning Debug</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={22} color={Colors.error} />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  profileCard: {
    borderRadius: 15,
    padding: 20,
    backgroundColor: Colors.backgroundCard,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: Colors.primary,
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: `${Colors.accent}20`,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },
  streakText: {
    marginLeft: 5,
    color: Colors.accent,
    fontWeight: '600',
    fontSize: 12,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    padding: 15,
    borderRadius: 10,
    width: width / 4 - 20,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  achievementsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  achievementDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  achievementDate: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  rarityBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  rarityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  actionText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: Colors.text,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 10,
    padding: 15,
    borderRadius: 10,
    backgroundColor: `${Colors.error}20`,
  },
  signOutButtonText: {
    marginLeft: 15,
    color: Colors.error,
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.text,
    fontSize: 18,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Preference learning styles
  preferencesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  preferencesCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 15,
    padding: 20,
  },
  preferencesSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 15,
  },
  preferenceItem: {
    marginBottom: 15,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  preferenceStats: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  preferenceStatsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  // Debug styles
  debugSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  debugCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 15,
    padding: 20,
  },
  debugSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 15,
  },
  debugItem: {
    marginBottom: 15,
  },
  debugLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  debugScore: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  debugInteraction: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
    fontStyle: 'italic',
  },
}); 