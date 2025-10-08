import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Achievement } from '../types';
import { useUser } from '../contexts/UserContext';
import AchievementBadge from '../components/AchievementBadge';
import { AchievementService } from '../services/achievementService';
import { Ionicons } from '@expo/vector-icons';

export default function AchievementsScreen() {
  const { user } = useUser();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, [user]);

  const loadAchievements = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const achievementsList = await AchievementService.getAchievements(user.id);
      
      // Sort achievements by unlock date
      achievementsList.sort((a, b) => {
        return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
      });
      
      setAchievements(achievementsList);
    } catch (error) {
      console.error('Error loading achievements:', error);
      Alert.alert('Error', 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const groupAchievementsByType = () => {
    const grouped: Record<string, Achievement[]> = {};
    achievements.forEach(achievement => {
      if (!grouped[achievement.type]) {
        grouped[achievement.type] = [];
      }
      grouped[achievement.type].push(achievement);
    });
    return grouped;
  };

  const getTypeTitle = (type: string): string => {
    switch (type) {
      case 'wardrobe':
        return 'Wardrobe Milestones';
      case 'streak':
        return 'Style Streaks';
      case 'category':
        return 'Category Mastery';
      case 'social':
        return 'Social Achievements';
      case 'special':
        return 'Special Achievements';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const handleAchievementPress = (achievement: Achievement) => {
    Alert.alert(
      achievement.title,
      `${achievement.description}\n\nProgress: ${achievement.progress}/${achievement.maxProgress}`,
      [{ text: 'Cool!', style: 'default' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const groupedAchievements = groupAchievementsByType();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {Object.entries(groupedAchievements).map(([type, typeAchievements]) => (
          <View key={type} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons 
                name={type === 'wardrobe' ? 'shirt' : type === 'streak' ? 'flame' : 'trophy'} 
                size={24} 
                color={Colors.primary} 
              />
              <Text style={styles.sectionTitle}>{getTypeTitle(type)}</Text>
            </View>
            <View style={styles.achievementsGrid}>
              {typeAchievements.map(achievement => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  size="large"
                  onPress={() => handleAchievementPress(achievement)}
                />
              ))}
            </View>
          </View>
        ))}
        
        {achievements.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No Achievements Yet</Text>
            <Text style={styles.emptySubtext}>
              Start adding items to your wardrobe and creating outfits to earn achievements!
            </Text>
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
}); 