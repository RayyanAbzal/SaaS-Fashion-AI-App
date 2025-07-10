import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Gradients } from '@/constants/colors';

// Define missing types locally
interface StyleMoment {
  id: string;
  userId: string;
  outfitId: string;
  imageUrl: string;
  caption: string;
  location: string;
  tags: string[];
  reactions: Reaction[];
  createdAt: Date;
  expiresAt: Date;
}

interface Reaction {
  type: 'fire' | 'love' | 'cool';
  userId: string;
  timestamp: Date;
}

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
        userId: 'user1',
        outfitId: 'outfit2',
        imageUrl: 'https://via.placeholder.com/400x600/4ECDC4/FFFFFF?text=Style+2',
        caption: 'Coffee shop aesthetic ☕️',
        location: 'Local Coffee Shop',
        tags: ['coffee', 'casual', 'minimalist'],
        reactions: [
          { type: 'fire', userId: 'user5', timestamp: new Date() },
          { type: 'love', userId: 'user6', timestamp: new Date() },
        ],
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000), // 20 hours left
      },
      {
        id: '3',
        userId: 'user1',
        outfitId: 'outfit3',
        imageUrl: 'https://via.placeholder.com/400x600/45B7D1/FFFFFF?text=Style+3',
        caption: 'Weekend brunch outfit 🥂',
        location: 'Downtown Restaurant',
        tags: ['brunch', 'elegant', 'weekend'],
        reactions: [
          { type: 'fire', userId: 'user7', timestamp: new Date() },
          { type: 'love', userId: 'user8', timestamp: new Date() },
          { type: 'cool', userId: 'user9', timestamp: new Date() },
          { type: 'fire', userId: 'user10', timestamp: new Date() },
        ],
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000), // 18 hours left
      },
    ];

    setMoments(mockMoments);
  };

  const handleMomentPress = (moment: StyleMoment) => {
    setSelectedMoment(moment);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCloseModal = () => {
    setSelectedMoment(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleReaction = (momentId: string, reactionType: 'fire' | 'love' | 'cool') => {
    setMoments(prev => prev.map(moment => {
      if (moment.id === momentId) {
        const newReaction: Reaction = {
          type: reactionType,
          userId: 'currentUser',
          timestamp: new Date(),
        };
        return {
          ...moment,
          reactions: [...moment.reactions, newReaction],
        };
      }
      return moment;
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const getReactionCount = (reactions: Reaction[], type: 'fire' | 'love' | 'cool') => {
    return reactions.filter((r: Reaction) => r.type === type).length;
  };

  const renderMoment = ({ item }: { item: StyleMoment }) => (
    <TouchableOpacity
      style={styles.momentCard}
      onPress={() => handleMomentPress(item)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.momentImage} />
      <View style={styles.momentOverlay}>
        <View style={styles.momentHeader}>
          <Text style={styles.momentCaption}>{item.caption}</Text>
          <Text style={styles.momentLocation}>{item.location}</Text>
        </View>
        
        <View style={styles.momentFooter}>
          <View style={styles.reactionsContainer}>
            <TouchableOpacity
              style={styles.reactionButton}
              onPress={() => handleReaction(item.id, 'fire')}
            >
              <Text style={styles.reactionEmoji}>🔥</Text>
              <Text style={styles.reactionCount}>{getReactionCount(item.reactions, 'fire')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.reactionButton}
              onPress={() => handleReaction(item.id, 'love')}
            >
              <Text style={styles.reactionEmoji}>❤️</Text>
              <Text style={styles.reactionCount}>{getReactionCount(item.reactions, 'love')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.reactionButton}
              onPress={() => handleReaction(item.id, 'cool')}
            >
              <Text style={styles.reactionEmoji}>😎</Text>
              <Text style={styles.reactionCount}>{getReactionCount(item.reactions, 'cool')}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.tagsContainer}>
            {item.tags.map((tag: string, index: number) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Style Moments</Text>
        <Text style={styles.subtitle}>Share your daily looks</Text>
      </View>

      <FlatList
        data={moments}
        renderItem={renderMoment}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.momentsList}
      />

      {selectedMoment && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            onPress={handleCloseModal}
            activeOpacity={1}
          />
          <View style={styles.momentDetailContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseModal}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            
            <Image source={{ uri: selectedMoment.imageUrl }} style={styles.detailImage} />
            
            <View style={styles.detailContent}>
              <Text style={styles.detailCaption}>{selectedMoment.caption}</Text>
              <Text style={styles.detailLocation}>{selectedMoment.location}</Text>
              
              <View style={styles.detailReactions}>
                <Text style={styles.detailReactionsTitle}>Reactions</Text>
                <View style={styles.detailReactionsList}>
                  <View style={styles.detailReaction}>
                    <Text style={styles.detailReactionEmoji}>🔥</Text>
                    <Text style={styles.detailReactionCount}>{getReactionCount(selectedMoment.reactions, 'fire')}</Text>
                  </View>
                  <View style={styles.detailReaction}>
                    <Text style={styles.detailReactionEmoji}>❤️</Text>
                    <Text style={styles.detailReactionCount}>{getReactionCount(selectedMoment.reactions, 'love')}</Text>
                  </View>
                  <View style={styles.detailReaction}>
                    <Text style={styles.detailReactionEmoji}>😎</Text>
                    <Text style={styles.detailReactionCount}>{getReactionCount(selectedMoment.reactions, 'cool')}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.detailTags}>
                <Text style={styles.detailTagsTitle}>Tags</Text>
                <View style={styles.detailTagsList}>
                  {selectedMoment.tags.map((tag: string, index: number) => (
                    <View key={index} style={styles.detailTag}>
                      <Text style={styles.detailTagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
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
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  momentsList: {
    padding: 20,
  },
  momentCard: {
    width: '100%',
    height: 300,
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
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  momentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  momentHeader: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    height: '60%',
  },
  momentCaption: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  momentLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  momentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  reactionsContainer: {
    flexDirection: 'row',
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  reactionEmoji: {
    fontSize: 20,
  },
  reactionCount: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: Colors.text,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  momentDetailContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundGlass,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  detailImage: {
    width: '100%',
    height: 250,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  detailContent: {
    padding: 20,
  },
  detailCaption: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  detailLocation: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 15,
  },
  detailReactions: {
    marginBottom: 15,
  },
  detailReactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  detailReactionsList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailReaction: {
    alignItems: 'center',
  },
  detailReactionEmoji: {
    fontSize: 24,
  },
  detailReactionCount: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 4,
  },
  detailTags: {
    marginTop: 15,
  },
  detailTagsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  detailTagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailTag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailTagText: {
    fontSize: 12,
    color: Colors.text,
  },
}); 