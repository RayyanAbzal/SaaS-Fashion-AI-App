import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { PerfumeRecommendation } from '../services/perfumeService';

interface PerfumeRecommendationCardProps {
  recommendation: PerfumeRecommendation;
  onSwipe?: () => void;
}

export default function PerfumeRecommendationCard({
  recommendation,
  onSwipe,
}: PerfumeRecommendationCardProps) {
  const { perfume, sprayCount, reasoning, matchScore } = recommendation;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="flower" size={24} color={Colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Perfume Recommendation</Text>
          <Text style={styles.subtitle}>Perfect scent for this outfit</Text>
        </View>
        {matchScore >= 70 && (
          <View style={styles.badge}>
            <Ionicons name="star" size={12} color={Colors.warning} />
            <Text style={styles.badgeText}>Best Match</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.perfumeInfo}>
          <Text style={styles.perfumeName}>{perfume.name}</Text>
          {perfume.brand && (
            <Text style={styles.perfumeBrand}>{perfume.brand}</Text>
          )}
        </View>

        <View style={styles.sprayContainer}>
          <View style={styles.sprayInfo}>
            <Ionicons name="water" size={18} color={Colors.primary} />
            <Text style={styles.sprayCount}>{sprayCount} spray{sprayCount !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.sprayVisual}>
            {Array.from({ length: 5 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.sprayDot,
                  i < sprayCount && styles.sprayDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Detailed Reasoning - Why this perfume works */}
        <View style={styles.reasoningContainer}>
          <Text style={styles.reasoningTitle}>Why this works for you:</Text>
          <Text style={styles.reasoningText}>{reasoning}</Text>
        </View>
      </View>

      {onSwipe && (
        <TouchableOpacity style={styles.swipeButton} onPress={onSwipe}>
          <Ionicons name="swap-horizontal" size={16} color={Colors.text} />
          <Text style={styles.swipeButtonText}>See another scent</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.warning,
  },
  content: {
    gap: 12,
  },
  perfumeInfo: {
    marginBottom: 4,
  },
  perfumeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  perfumeBrand: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  sprayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSecondary,
    padding: 12,
    borderRadius: 12,
  },
  sprayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sprayCount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  sprayVisual: {
    flexDirection: 'row',
    gap: 6,
  },
  sprayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sprayDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  reasoningContainer: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  reasoningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  reasoningText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  swipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 8,
    gap: 6,
  },
  swipeButtonText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});

