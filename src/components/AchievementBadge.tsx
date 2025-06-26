import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';
import { Achievement } from '../types';

interface AchievementBadgeProps {
  achievement: Achievement;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export default function AchievementBadge({ achievement, onPress, size = 'medium' }: AchievementBadgeProps) {
  const getSize = () => {
    switch (size) {
      case 'small':
        return { badge: 40, icon: 20, font: 10 };
      case 'large':
        return { badge: 80, icon: 40, font: 16 };
      default:
        return { badge: 60, icon: 30, font: 12 };
    }
  };

  const sizeValues = getSize();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: sizeValues.badge,
          height: sizeValues.badge,
        },
        onPress && styles.pressable
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={[styles.icon, { fontSize: sizeValues.icon }]}>{achievement.icon}</Text>
      {size !== 'small' && (
        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar,
              { width: `${(achievement.progress / achievement.maxProgress) * 100}%` }
            ]} 
          />
        </View>
      )}
      {size === 'large' && (
        <Text style={[styles.title, { fontSize: sizeValues.font }]} numberOfLines={2}>
          {achievement.title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pressable: {
    opacity: 1,
  },
  icon: {
    marginBottom: 4,
  },
  title: {
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 4,
  },
  progressContainer: {
    width: '80%',
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
}); 