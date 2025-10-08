// App entry point

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';

// Import screens
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import WardrobeScreen from './src/screens/WardrobeScreen';
import OutfitCreationScreen from './src/screens/OutfitCreationScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BrandSelectionScreen from './src/screens/BrandSelectionScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import PinterestBoardScreen from './src/screens/PinterestBoardScreen';
import StyleCheckScreen from './src/screens/StyleCheckScreen';
import AvatarSetupScreen from './src/screens/AvatarSetupScreen';
import AvatarViewScreen from './src/screens/AvatarViewScreen';
import ShoppingAssistantScreen from './src/screens/ShoppingAssistantScreen';
import StyleSwipeScreen from './src/screens/StyleSwipeScreen';

// Import services and context
import { AuthService } from './src/services/authService';
import { UserProvider, useUser } from './src/contexts/UserContext';
import { AvatarProvider } from './src/contexts/AvatarContext';
import { Colors } from './src/constants/colors';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Wardrobe') {
            iconName = focused ? 'shirt' : 'shirt-outline';
          } else if (route.name === 'Outfits') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.backgroundSecondary,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: Colors.text,
          fontWeight: '600',
        },
        headerTintColor: Colors.primary,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Wardrobe" 
        component={WardrobeScreen}
        options={{ 
          title: 'Wardrobe',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shirt" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: Colors.background },
      }}
    >
      {!user ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        <>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Camera" 
            component={CameraScreen}
            options={{
              headerShown: false,
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="OutfitCreation" 
            component={OutfitCreationScreen}
            options={{
              headerShown: false,
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="BrandSelection" 
            component={BrandSelectionScreen}
            options={{
              headerShown: false,
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="Achievements" 
            component={AchievementsScreen}
            options={{
              title: 'Achievements',
              headerTintColor: Colors.text,
              headerStyle: {
                backgroundColor: Colors.background,
              },
            }}
          />
          <Stack.Screen
            name="PinterestBoard"
            component={PinterestBoardScreen}
            options={{
              headerShown: true,
              title: 'Pinterest Board',
              headerStyle: {
                backgroundColor: Colors.background,
              },
              headerTintColor: Colors.primary,
              headerTitleStyle: {
                color: Colors.text,
                fontWeight: '600',
              },
            }}
          />
          <Stack.Screen
            name="AvatarSetup"
            component={AvatarSetupScreen as any}
            options={{
              headerShown: true,
              title: 'Create Your Avatar',
              headerStyle: {
                backgroundColor: Colors.background,
              },
              headerTintColor: Colors.primary,
              headerTitleStyle: {
                color: Colors.text,
                fontWeight: '600',
              },
            }}
          />
          <Stack.Screen
            name="AvatarView"
            component={AvatarViewScreen as any}
            options={{
              headerShown: true,
              title: 'My Avatar',
              headerStyle: {
                backgroundColor: Colors.background,
              },
              headerTintColor: Colors.primary,
              headerTitleStyle: {
                color: Colors.text,
                fontWeight: '600',
              },
            }}
          />
          <Stack.Screen
            name="ShoppingAssistant"
            component={ShoppingAssistantScreen as any}
            options={{
              headerShown: true,
              title: 'Shop',
              headerStyle: {
                backgroundColor: Colors.background,
              },
              headerTintColor: Colors.primary,
              headerTitleStyle: {
                color: Colors.text,
                fontWeight: '600',
              },
            }}
          />
          <Stack.Screen
            name="StyleSwipe"
            component={StyleSwipeScreen as any}
            options={{
              headerShown: true,
              title: 'AI Stylist',
              headerStyle: {
                backgroundColor: Colors.background,
              },
              headerTintColor: Colors.primary,
              headerTitleStyle: {
                color: Colors.text,
                fontWeight: '600',
              },
            }}
          />
          <Stack.Screen
            name="StyleCheck"
            component={StyleCheckScreen as any}
            options={{
              headerShown: true,
              title: 'Style Check',
              headerStyle: {
                backgroundColor: Colors.background,
              },
              headerTintColor: Colors.primary,
              headerTitleStyle: {
                color: Colors.text,
                fontWeight: '600',
              },
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <AvatarProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <AppNavigator />
          </NavigationContainer>
        </AvatarProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
} 