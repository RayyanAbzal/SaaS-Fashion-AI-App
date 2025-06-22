import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { User } from '../types';
import { AuthService } from '../services/authService';
import { getCurrentWeather } from '../services/weatherService';

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [user, setUser] = useState<User | null>(null);
  const [weather, setWeather] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
    loadWeatherData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadWeatherData = async () => {
    try {
      const weatherData = await getCurrentWeather();
      setWeather(weatherData);
    } catch (error) {
      console.error('Error loading weather data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatShouldIWear = () => {
    navigation.navigate('OutfitSwiper');
  };

  const handleQuickActions = (action: string) => {
    switch (action) {
      case 'wardrobe':
        navigation.navigate('Wardrobe');
        break;
      case 'chat':
        navigation.navigate('Chat');
        break;
      case 'camera':
        navigation.navigate('Camera');
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your style dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Good {getTimeOfDay()}, {user?.displayName || 'Fashionista'}! 👋
          </Text>
          <Text style={styles.subtitle}>
            Ready to slay today's outfit?
          </Text>
        </View>

        {/* Weather Card */}
        {weather && (
          <View style={styles.weatherCard}>
            <View style={styles.weatherHeader}>
              <Ionicons name="partly-sunny" size={24} color={Colors.primary} />
              <Text style={styles.weatherTitle}>Today's Weather</Text>
            </View>
            <View style={styles.weatherInfo}>
              <Text style={styles.temperature}>{Math.round(weather.temperature)}°C</Text>
              <Text style={styles.weatherDescription}>{weather.description}</Text>
            </View>
            <Text style={styles.weatherTip}>
              Perfect for {getWeatherOutfitSuggestion(weather.temperature)} outfits!
            </Text>
          </View>
        )}

        {/* Main Action Button */}
        <TouchableOpacity
          style={styles.mainActionButton}
          onPress={handleWhatShouldIWear}
        >
          <View style={styles.mainActionContent}>
            <Ionicons name="shirt" size={32} color={Colors.text} />
            <Text style={styles.mainActionText}>What should I wear?</Text>
            <Text style={styles.mainActionSubtext}>
              Get AI-powered outfit suggestions
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={Colors.text} />
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickActions('wardrobe')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="shirt-outline" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.quickActionText}>Wardrobe</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickActions('chat')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="chatbubble-outline" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.quickActionText}>Style Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickActions('camera')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="camera-outline" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.quickActionText}>Add Item</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('OutfitSwiper')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="heart-outline" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.quickActionText}>Outfits</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('StyleMate')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="sparkles-outline" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.quickActionText}>StyleMate</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Inspiration */}
        <View style={styles.inspirationContainer}>
          <Text style={styles.sectionTitle}>Today's Inspiration</Text>
          <View style={styles.inspirationCard}>
            <Ionicons name="sparkles" size={24} color={Colors.accent} />
            <Text style={styles.inspirationText}>
              "Fashion is the armor to survive the reality of everyday life." - Bill Cunningham
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getTimeOfDay = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

const getWeatherOutfitSuggestion = (temperature: number): string => {
  if (temperature < 10) return 'warm, layered';
  if (temperature < 20) return 'light layers';
  if (temperature < 25) return 'casual, comfortable';
  return 'light, breathable';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  weatherCard: {
    backgroundColor: Colors.backgroundCard,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 8,
  },
  weatherInfo: {
    marginBottom: 8,
  },
  temperature: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
  },
  weatherDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  weatherTip: {
    fontSize: 14,
    color: Colors.accent,
    fontStyle: 'italic',
  },
  mainActionButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainActionContent: {
    flex: 1,
  },
  mainActionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 8,
  },
  mainActionSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  quickActionsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  quickActionButton: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '47%',
  },
  quickActionIcon: {
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  inspirationContainer: {
    marginBottom: 20,
  },
  inspirationCard: {
    backgroundColor: Colors.backgroundCard,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inspirationText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
    flex: 1,
    fontStyle: 'italic',
  },
}); 