import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Gradients } from '@/constants/colors';
import { StyleMoment, Reaction } from '@/types';

const { width, height } = Dimensions.get('window');

export default function StyleMomentsScreen() {
  const [moments, setMoments] = useState<StyleMoment[]>([]);
  const [selectedMoment, setSelectedMoment] = useState<StyleMoment | null>(null);

  useEffect(() => {
    generateMockMoments();
  }, []);

  const generateMockMoments = () => {
    const mockMoments: StyleMoment[] = [
      {
        id: '1',
        userId: 'user1',
        outfitId: 'outfit1',
        imageUrl: 'https://via.placeholder.com/400x600/FF6B9D/FFFFFF?text=Style+1',
        caption: 'Campus vibes today! 💅✨',
        location: 'University Campus',
        tags: ['campus', 'casual', 'trendy'],
        reactions: [
          { type: 'fire', userId: 'user2', timestamp: new Date() },
          { type: 'love', userId: 'user3', timestamp: new Date() },
          { type: 'cool', userId: 'user4', timestamp: new Date() },
        ],
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000), // 22 hours left
      },
      {
        id: '2',
        userId: 'user2',
        outfitId: 'outfit2',
        imageUrl: 'https://via.placeholder.com/400x600/4ECDC4/FFFFFF?text=Style+2',
        caption: 'Study session fit 📚',
        location: 'Library',
        tags: ['study', 'comfortable', 'neutral'],
        reactions: [
          { type: 'like', userId: 'user1', timestamp: new Date() },
          { type: 'fire', userId: 'user5', timestamp: new Date() },
        ],
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000), // 20 hours left
      },
      {
        id: '3',
        userId: 'user3',
        outfitId: 'outfit3',
        imageUrl: 'https://via.placeholder.com/400x600/FFD93D/FFFFFF?text=Style+3',
        caption: 'Weekend energy! 🌟',
        location: 'Downtown',
        tags: ['weekend', 'party', 'bold'],
        reactions: [
          { type: 'love', userId: 'user1', timestamp: new Date() },
          { type: 'fire', userId: 'user2', timestamp: new Date() },
          { type: 'wow', userId: 'user6', timestamp: new Date() },
        ],
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000), // 18 hours left
      },
    ];

    setMoments(mockMoments);
  };

  const handleReaction = (momentId: string, reactionType: Reaction['type']) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setMoments(prev => prev.map(moment => {
      if (moment.id === momentId) {
        const newReaction: Reaction = {
          type: reactionType,
          userId: 'currentUser',
          timestamp: new Date()
        };
        
        return {
          ...moment,
          reactions: [...moment.reactions, newReaction]
        };
      }
      return moment;
    }));
  };

  const getReactionCount = (moment: StyleMoment, type: Reaction['type']) => {
    return moment.reactions.filter(r => r.type === type).length;
  };

  const getTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const renderMoment = ({ item }: { item: StyleMoment }) => (
    <TouchableOpacity
      style={styles.momentCard}
      onPress={() => setSelectedMoment(item)}
    >
      <View style={styles.momentImage}>
        <View style={styles.momentOverlay}>
          <View style={styles.momentHeader}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color={Colors.text} />
              </View>
              <Text style={styles.username}>User {item.userId.slice(-1)}</Text>
            </View>
            <Text style={styles.timeRemaining}>{getTimeRemaining(item.expiresAt)}</Text>
          </View>
          
          <View style={styles.momentContent}>
            <Text style={styles.caption}>{item.caption}</Text>
            {item.location && (
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={14} color={Colors.textSecondary} />
                <Text style={styles.location}>{item.location}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.reactionsContainer}>
            <View style={styles.reactionButtons}>
              <TouchableOpacity
                style={styles.reactionButton}
                onPress={() => handleReaction(item.id, 'like')}
              >
                <Ionicons name="heart" size={20} color={Colors.like} />
                <Text style={styles.reactionCount}>{getReactionCount(item, 'like')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.reactionButton}
                onPress={() => handleReaction(item.id, 'fire')}
              >
                <Ionicons name="flame" size={20} color={Colors.fire} />
                <Text style={styles.reactionCount}>{getReactionCount(item, 'fire')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.reactionButton}
                onPress={() => handleReaction(item.id, 'cool')}
              >
                <Ionicons name="snow" size={20} color={Colors.cool} />
                <Text style={styles.reactionCount}>{getReactionCount(item, 'cool')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.reactionButton}
                onPress={() => handleReaction(item.id, 'wow')}
              >
                <Ionicons name="star" size={20} color={Colors.accent} />
                <Text style={styles.reactionCount}>{getReactionCount(item, 'wow')}</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMomentDetail = () => {
    if (!selectedMoment) return null;

    return (
      <View style={styles.momentDetailModal}>
        <View style={styles.momentDetailContent}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>Style Moment</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedMoment(null)}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.detailImage}>
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imageText}>Outfit Image</Text>
            </View>
          </View>
          
          <Text style={styles.detailCaption}>{selectedMoment.caption}</Text>
          
          <View style={styles.detailStats}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Reactions:</Text>
              <Text style={styles.statValue}>{selectedMoment.reactions.length}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Time Left:</Text>
              <Text style={styles.statValue}>{getTimeRemaining(selectedMoment.expiresAt)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Tags:</Text>
              <View style={styles.tagsContainer}>
                {selectedMoment.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.appTitle}>Style Moments</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <FlatList
          data={moments}
          renderItem={renderMoment}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.momentsList}
        />
      </View>

      {renderMomentDetail()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  momentsList: {
    padding: 20,
  },
  momentCard: {
    width: width - 40,
    height: height * 0.4,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  momentImage: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSecondary,
  },
  momentOverlay: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  momentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  timeRemaining: {
    fontSize: 12,
    color: Colors.textSecondary,
    backgroundColor: Colors.backgroundGlass,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  momentContent: {
    flex: 1,
    justifyContent: 'center',
  },
  caption: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  reactionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reactionButtons: {
    flexDirection: 'row',
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundGlass,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  reactionCount: {
    fontSize: 12,
    color: Colors.text,
    marginLeft: 4,
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundGlass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  momentDetailModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  momentDetailContent: {
    width: width - 40,
    maxHeight: height * 0.8,
    padding: 20,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundGlass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: Colors.backgroundGlass,
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundGlass,
  },
  imageText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  detailCaption: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  detailStats: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: Colors.text,
  },
}); 