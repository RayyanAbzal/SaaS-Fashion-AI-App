import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PinterestBoardAnalyzer from '../components/PinterestBoardAnalyzer';
import PinterestBoardService, { BoardAnalysis, StyleInsight } from '../services/pinterestBoardService';
import { useUser } from '../contexts/UserContext';

export default function PinterestStyleScreen() {
  const { user } = useUser();
  const [analyzedBoards, setAnalyzedBoards] = useState<BoardAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserBoards();
  }, []);

  const loadUserBoards = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const boards = await PinterestBoardService.getUserBoards(user.id);
      setAnalyzedBoards(boards);
    } catch (error) {
      console.error('Error loading user boards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserBoards();
    setRefreshing(false);
  };

  const handleBoardAnalyzed = async (analysis: BoardAnalysis) => {
    if (!user?.id) return;

    try {
      // Save the analysis to user's profile
      const saved = await PinterestBoardService.saveBoardAnalysis(user.id, analysis);
      
      if (saved) {
        // Add to local state
        setAnalyzedBoards(prev => [analysis, ...prev]);
        
        Alert.alert(
          'Analysis Complete! 🎉',
          'Your Pinterest board has been analyzed and your style profile has been updated with new insights!'
        );
      }
    } catch (error) {
      console.error('Error saving board analysis:', error);
      Alert.alert(
        'Save Failed',
        'Could not save your board analysis. Please try again.'
      );
    }
  };

  const handleStyleInsightsUpdate = (insights: StyleInsight) => {
    console.log('Style insights updated:', insights);
    // Here you could update the user's style profile in real-time
    // or trigger outfit generation with new insights
  };

  const handleDeleteBoard = (boardId: string) => {
    Alert.alert(
      'Delete Board Analysis',
      'Are you sure you want to delete this board analysis?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setAnalyzedBoards(prev => prev.filter(board => board.board.id !== boardId));
          }
        }
      ]
    );
  };

  const renderAnalyzedBoard = (analysis: BoardAnalysis) => (
    <View key={analysis.board.id} style={styles.boardCard}>
      <View style={styles.boardHeader}>
        <View style={styles.boardInfo}>
          <Text style={styles.boardName}>{analysis.board.name}</Text>
          <Text style={styles.boardStats}>
            {analysis.board.pinCount} pins • {Math.round(analysis.styleInsights.confidence * 100)}% confidence
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteBoard(analysis.board.id)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.insightsPreview}>
        <Text style={styles.insightLabel}>Style: {analysis.styleInsights.aesthetic}</Text>
        <View style={styles.colorPreview}>
          {analysis.styleInsights.colorPalette.slice(0, 4).map((color, index) => (
            <View
              key={index}
              style={[
                styles.colorDot,
                { backgroundColor: getColorHex(color) }
              ]}
            />
          ))}
        </View>
      </View>
      
      <View style={styles.boardMeta}>
        <Text style={styles.analysisDate}>
          Analyzed {analysis.analysisDate.toLocaleDateString()}
        </Text>
        <Text style={styles.processingTime}>
          {analysis.processingTime}s
        </Text>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>🎨 Enhance Your Style</Text>
        <Text style={styles.subtitle}>
          Optionally connect your Pinterest boards to get even more personalized outfit recommendations that match your actual style preferences
        </Text>
      </View>

      {/* Pinterest Board Analyzer Component */}
      <PinterestBoardAnalyzer
        onAnalysisComplete={handleBoardAnalyzed}
        onStyleInsightsUpdate={handleStyleInsightsUpdate}
      />

      {/* Previously Analyzed Boards */}
      {analyzedBoards.length > 0 && (
        <View style={styles.analyzedBoardsSection}>
          <Text style={styles.sectionTitle}>Your Analyzed Boards</Text>
          {analyzedBoards.map(renderAnalyzedBoard)}
        </View>
      )}

      {/* Empty State */}
      {analyzedBoards.length === 0 && !isLoading && (
        <View style={styles.emptyState}>
          <Ionicons name="logo-pinterest" size={64} color="#E9ECEF" />
          <Text style={styles.emptyTitle}>Ready to Enhance Your Style?</Text>
          <Text style={styles.emptySubtitle}>
            Your AI stylist already works great! Adding Pinterest boards will make recommendations even more personalized to your unique style preferences.
          </Text>
        </View>
      )}

      {/* How It Works Section */}
      <View style={styles.howItWorksSection}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        
        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Paste Your Board URL</Text>
            <Text style={styles.stepDescription}>
              Copy and paste any Pinterest board URL that represents your style
            </Text>
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>AI Analysis</Text>
            <Text style={styles.stepDescription}>
              Our AI analyzes your pins to understand your color preferences, style aesthetic, and clothing choices
            </Text>
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Get Recommendations</Text>
            <Text style={styles.stepDescription}>
              Receive personalized outfit recommendations and style insights based on your Pinterest preferences
            </Text>
          </View>
        </View>
      </View>

      {/* Benefits Section */}
      <View style={styles.benefitsSection}>
        <Text style={styles.sectionTitle}>Why Add Pinterest? (Optional)</Text>
        
        <View style={styles.benefitItem}>
          <Ionicons name="sparkles-outline" size={24} color="#FF6B6B" />
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>Discover Your Style</Text>
            <Text style={styles.benefitDescription}>
              Get deeper insights into your aesthetic preferences and style personality
            </Text>
          </View>
        </View>

        <View style={styles.benefitItem}>
          <Ionicons name="shirt-outline" size={24} color="#FF6B6B" />
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>Personalized Outfits</Text>
            <Text style={styles.benefitDescription}>
              Get even more personalized outfit recommendations that match your unique taste
            </Text>
          </View>
        </View>

        <View style={styles.benefitItem}>
          <Ionicons name="trending-up-outline" size={24} color="#FF6B6B" />
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>Style Evolution</Text>
            <Text style={styles.benefitDescription}>
              Track how your style preferences change and evolve over time
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// Helper function to convert color names to hex codes
const getColorHex = (color: string): string => {
  const colorMap: { [key: string]: string } = {
    'white': '#FFFFFF',
    'black': '#000000',
    'navy': '#000080',
    'beige': '#F5F5DC',
    'cream': '#FFFDD0',
    'gray': '#808080',
    'grey': '#808080',
    'brown': '#8B4513',
    'red': '#FF0000',
    'blue': '#0000FF',
    'green': '#00FF00',
    'pink': '#FF69B4',
    'purple': '#800080',
    'orange': '#FFA500',
    'yellow': '#FFFF00'
  };
  return colorMap[color.toLowerCase()] || '#808080';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D',
    lineHeight: 22,
  },
  analyzedBoardsSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  boardCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  boardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  boardInfo: {
    flex: 1,
  },
  boardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  boardStats: {
    fontSize: 14,
    color: '#6C757D',
  },
  deleteButton: {
    padding: 4,
  },
  insightsPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightLabel: {
    fontSize: 14,
    color: '#495057',
    textTransform: 'capitalize',
  },
  colorPreview: {
    flexDirection: 'row',
    gap: 4,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  boardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analysisDate: {
    fontSize: 12,
    color: '#6C757D',
  },
  processingTime: {
    fontSize: 12,
    color: '#6C757D',
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 20,
  },
  howItWorksSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 10,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
  },
  benefitsSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 10,
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  benefitContent: {
    flex: 1,
    marginLeft: 16,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
  },
});
