import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { User } from '../types';
import { AuthService } from '../services/authService';
import { WeatherService, WeatherData, OutfitRecommendation } from '../services/weatherService';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import * as Location from 'expo-location';
import { useUser } from '../contexts/UserContext';
import { MainTabParamList, RootStackParamList } from '../types';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [recommendations, setRecommendations] = useState<OutfitRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user: userContext } = useUser();

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
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Access Required',
          'Please enable location services to get weather-based outfit recommendations.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Get weather data
      const weatherData = await WeatherService.getCurrentWeather(
        location.coords.latitude,
        location.coords.longitude
      );
      setWeather(weatherData);

      // Get outfit recommendations
      const outfitRecs = WeatherService.getOutfitRecommendations(weatherData);
      setRecommendations(outfitRecs);
    } catch (error) {
      console.error('Error loading weather data:', error);
      Alert.alert(
        'Error',
        'Failed to load weather data. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWeatherData();
    setRefreshing(false);
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

  if (loading) {
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Pinterest Board Button */}
        <TouchableOpacity
          style={styles.pinterestButton}
          onPress={() => (navigation as any).navigate('PinterestBoard')}
        >
          <Ionicons name="logo-pinterest" size={24} color={Colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.pinterestButtonText}>Analyze Pinterest Board</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Good {getTimeOfDay()}, {user?.displayName || 'Fashionista'}!
          </Text>
          <Text style={styles.subtitle}>
            Ready to slay today's outfit?
          </Text>
        </View>

        {/* Weather Card */}
        {weather && (
          <View style={styles.weatherCard}>
            <View style={styles.weatherHeader}>
              <Image
                source={{ uri: weather.icon }}
                style={styles.weatherIcon}
              />
              <View>
                <Text style={styles.temperature}>{weather.temperature}°C</Text>
                <Text style={styles.weatherDescription}>
                  {weather.description}
                </Text>
              </View>
            </View>
            <View style={styles.weatherDetails}>
              <View style={styles.weatherDetail}>
                <Ionicons name="thermometer" size={20} color={Colors.text} />
                <Text style={styles.detailText} numberOfLines={1} ellipsizeMode="tail">
                  Feels like {weather.feelsLike}°C
                </Text>
              </View>
              <View style={styles.weatherDetail}>
                <Ionicons name="water" size={20} color={Colors.text} />
                <Text style={styles.detailText} numberOfLines={1} ellipsizeMode="tail">
                  Humidity {weather.humidity}%
                </Text>
              </View>
              <View style={styles.weatherDetail}>
                <Ionicons name="umbrella" size={20} color={Colors.text} />
                <Text style={styles.detailText} numberOfLines={1} ellipsizeMode="tail">
                  Rain {weather.precipitation}mm
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Recommendations Section */}
        {recommendations && (
          <View style={styles.recommendationsCard}>
            <Text style={styles.sectionTitle}>Today's Outfit Recommendations</Text>
            
            {Object.entries(recommendations.recommendations).map(([category, items]) => (
              items.length > 0 && (
                <View key={category} style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                  <View style={styles.recommendationsList}>
                    {items.map((item, index) => (
                      <View key={index} style={styles.recommendationItem}>
                        <Ionicons
                          name={
                            category === 'tops' ? 'shirt-outline' :
                            category === 'bottoms' ? 'apps-outline' :
                            category === 'outerwear' ? 'cloud-outline' :
                            'glasses-outline'
                          }
                          size={20}
                          color={Colors.text}
                        />
                        <Text style={styles.recommendationText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )
            ))}
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
  scrollContent: {
    padding: 16,
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherIcon: {
    width: 64,
    height: 64,
    marginRight: 16,
  },
  temperature: {
    fontSize: 32,
    fontWeight: '600',
    color: Colors.text,
  },
  weatherDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexWrap: 'wrap', // allow wrapping
  },
  weatherDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // ensure each detail takes equal space
    minWidth: 0, // allow shrinking
  },
  detailText: {
    marginLeft: 8,
    color: Colors.text,
    flexShrink: 1,
  },
  recommendationsCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 18,
  },
  categorySection: {
    marginBottom: 18,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 10,
  },
  recommendationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    marginRight: 10,
    marginBottom: 10,
    minHeight: 38,
    minWidth: 44,
    shadowColor: Colors.primary,
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  recommendationText: {
    marginLeft: 10,
    color: Colors.text,
    fontSize: 15,
    fontWeight: '500',
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
  pinterestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: 20, // increased for pill look
    paddingVertical: 16, // more vertical padding
    paddingHorizontal: 24, // more horizontal padding
    marginBottom: 24, // more space below
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  pinterestButtonText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 0.2,
  },
}); 