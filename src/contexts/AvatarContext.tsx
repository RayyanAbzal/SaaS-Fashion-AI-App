// Avatar Context - Global avatar state management
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserAvatar } from '../services/enhancedOracleService';

interface AvatarContextType {
  userAvatar: UserAvatar | null;
  setUserAvatar: (avatar: UserAvatar | null) => void;
  hasAvatar: boolean;
  isLoading: boolean;
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

interface AvatarProviderProps {
  children: ReactNode;
}

export function AvatarProvider({ children }: AvatarProviderProps) {
  const [userAvatar, setUserAvatar] = useState<UserAvatar | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load avatar from storage on mount
  useEffect(() => {
    loadAvatarFromStorage();
  }, []);

  // Save avatar to storage whenever it changes
  useEffect(() => {
    if (userAvatar) {
      saveAvatarToStorage(userAvatar);
    }
  }, [userAvatar]);

  const loadAvatarFromStorage = async () => {
    try {
      const savedAvatar = await AsyncStorage.getItem('userAvatar');
      if (savedAvatar) {
        const avatar = JSON.parse(savedAvatar);
        setUserAvatar(avatar);
        console.log('Loaded avatar from storage:', avatar);
      }
    } catch (error) {
      console.error('Error loading avatar from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAvatarToStorage = async (avatar: UserAvatar) => {
    try {
      await AsyncStorage.setItem('userAvatar', JSON.stringify(avatar));
      console.log('Saved avatar to storage:', avatar);
    } catch (error) {
      console.error('Error saving avatar to storage:', error);
    }
  };

  const value = {
    userAvatar,
    setUserAvatar,
    hasAvatar: userAvatar !== null,
    isLoading,
  };

  return (
    <AvatarContext.Provider value={value}>
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatar() {
  const context = useContext(AvatarContext);
  if (context === undefined) {
    throw new Error('useAvatar must be used within an AvatarProvider');
  }
  return context;
}
