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
import { User, Achievement, MainTabParamList } from '../types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation<any>();

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
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.logout();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleBrandSelection = () => {
    navigation.navigate('BrandSelection');
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
              <Text style={styles.statNumber}>156</Text>
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

        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          {mockAchievements.map(renderAchievement)}
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleBrandSelection}>
            <Ionicons name="shirt" size={20} color={Colors.text} />
            <Text style={styles.actionText}>Brand Preferences</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="notifications" size={20} color={Colors.text} />
            <Text style={styles.actionText}>Notifications</Text>
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
}); 