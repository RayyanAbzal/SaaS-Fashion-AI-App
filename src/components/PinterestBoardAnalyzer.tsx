import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PinterestBoardService, { BoardAnalysis, StyleInsight } from '../services/pinterestBoardService';

interface PinterestBoardAnalyzerProps {
  onAnalysisComplete?: (analysis: BoardAnalysis) => void;
  onStyleInsightsUpdate?: (insights: StyleInsight) => void;
}

const { width } = Dimensions.get('window');

export default function PinterestBoardAnalyzer({
  onAnalysisComplete,
  onStyleInsightsUpdate
}: PinterestBoardAnalyzerProps) {
  const [boardUrl, setBoardUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<BoardAnalysis | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleAnalyzeBoard = async () => {
    if (!boardUrl.trim()) {
      Alert.alert('Error', 'Please enter a Pinterest board URL');
      return;
    }

    setIsAnalyzing(true);
    setShowResults(false);

    try {
      console.log('🎨 Starting Pinterest board analysis...');
      const boardAnalysis = await PinterestBoardService.analyzeBoard(boardUrl);
      
      setAnalysis(boardAnalysis);
      setShowResults(true);
      
      // Notify parent components
      onAnalysisComplete?.(boardAnalysis);
      onStyleInsightsUpdate?.(boardAnalysis.styleInsights);
      
      console.log('✅ Board analysis completed successfully');
      
    } catch (error) {
      console.error('❌ Error analyzing board:', error);
      Alert.alert(
        'Analysis Failed',
        'Could not analyze the Pinterest board. Please check the URL and try again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClearAnalysis = () => {
    setAnalysis(null);
    setShowResults(false);
    setBoardUrl('');
  };

  const renderStyleInsights = (insights: StyleInsight) => (
    <View style={styles.insightsContainer}>
      <Text style={styles.insightsTitle}>🎨 Your Style Profile</Text>
      
      <View style={styles.insightRow}>
        <Text style={styles.insightLabel}>Aesthetic:</Text>
        <Text style={styles.insightValue}>{insights.aesthetic}</Text>
      </View>
      
      <View style={styles.insightRow}>
        <Text style={styles.insightLabel}>Colors:</Text>
        <View style={styles.colorPalette}>
          {insights.colorPalette.map((color, index) => (
            <View
              key={index}
              style={[
                styles.colorSwatch,
                { backgroundColor: getColorHex(color) }
              ]}
            />
          ))}
        </View>
      </View>
      
      <View style={styles.insightRow}>
        <Text style={styles.insightLabel}>Clothing Types:</Text>
        <View style={styles.tagContainer}>
          {insights.clothingTypes.map((type, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{type}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.insightRow}>
        <Text style={styles.insightLabel}>Patterns:</Text>
        <View style={styles.tagContainer}>
          {insights.patterns.map((pattern, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{pattern}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.insightRow}>
        <Text style={styles.insightLabel}>Materials:</Text>
        <View style={styles.tagContainer}>
          {insights.materials.map((material, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{material}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.insightRow}>
        <Text style={styles.insightLabel}>Brands:</Text>
        <View style={styles.tagContainer}>
          {insights.brands.map((brand, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{brand}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.insightRow}>
        <Text style={styles.insightLabel}>Occasions:</Text>
        <View style={styles.tagContainer}>
          {insights.occasions.map((occasion, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{occasion}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.confidenceContainer}>
        <Text style={styles.confidenceLabel}>
          Analysis Confidence: {Math.round(insights.confidence * 100)}%
        </Text>
        <View style={styles.confidenceBar}>
          <View 
            style={[
              styles.confidenceFill, 
              { width: `${insights.confidence * 100}%` }
            ]} 
          />
        </View>
      </View>
    </View>
  );

  const renderOutfitRecommendations = () => {
    if (!analysis?.outfitRecommendations) return null;

    return (
      <View style={styles.recommendationsContainer}>
        <Text style={styles.recommendationsTitle}>👗 Outfit Recommendations</Text>
        
        {analysis.outfitRecommendations.map((outfit, index) => (
          <View key={outfit.id} style={styles.outfitCard}>
            <Text style={styles.outfitName}>{outfit.name}</Text>
            <Text style={styles.outfitDescription}>{outfit.description}</Text>
            
            <View style={styles.outfitItems}>
              {outfit.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.outfitItem}>
                  <Text style={styles.itemType}>{item.type.toUpperCase()}</Text>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                  {item.brand && (
                    <Text style={styles.itemBrand}>{item.brand}</Text>
                  )}
                </View>
              ))}
            </View>
            
            <View style={styles.outfitMeta}>
              <Text style={styles.outfitOccasion}>{outfit.occasion}</Text>
              <Text style={styles.outfitSeason}>{outfit.season}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>🎨 Pinterest Style Analyzer</Text>
        <Text style={styles.subtitle}>
          Analyze your Pinterest boards to discover your unique style and get personalized outfit recommendations
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Pinterest Board URL</Text>
        <TextInput
          style={styles.urlInput}
          placeholder="https://pinterest.com/username/board-name"
          value={boardUrl}
          onChangeText={setBoardUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        
        <TouchableOpacity
          style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonDisabled]}
          onPress={handleAnalyzeBoard}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="analytics-outline" size={20} color="#FFFFFF" />
              <Text style={styles.analyzeButtonText}>Analyze Board</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {isAnalyzing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Analyzing your Pinterest board...</Text>
          <Text style={styles.loadingSubtext}>
            This may take a few moments while we analyze your style preferences
          </Text>
        </View>
      )}

      {showResults && analysis && (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Analysis Results</Text>
            <TouchableOpacity onPress={handleClearAnalysis} style={styles.clearButton}>
              <Ionicons name="close-circle-outline" size={24} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.boardInfo}>
            <Text style={styles.boardName}>{analysis.board.name}</Text>
            <Text style={styles.boardStats}>
              {analysis.board.pinCount} pins • Analyzed {analysis.analysisDate.toLocaleDateString()}
            </Text>
          </View>
          
          {renderStyleInsights(analysis.styleInsights)}
          {renderOutfitRecommendations()}
        </View>
      )}
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D',
    lineHeight: 22,
  },
  inputContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  urlInput: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    marginBottom: 16,
  },
  analyzeButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#ADB5BD',
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 20,
  },
  resultsContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  clearButton: {
    padding: 4,
  },
  boardInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  boardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  boardStats: {
    fontSize: 14,
    color: '#6C757D',
  },
  insightsContainer: {
    padding: 20,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  insightRow: {
    marginBottom: 16,
  },
  insightLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  insightValue: {
    fontSize: 16,
    color: '#2C3E50',
    textTransform: 'capitalize',
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: '#495057',
    textTransform: 'capitalize',
  },
  confidenceContainer: {
    marginTop: 8,
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#28A745',
    borderRadius: 4,
  },
  recommendationsContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  outfitCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  outfitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  outfitDescription: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 12,
  },
  outfitItems: {
    marginBottom: 12,
  },
  outfitItem: {
    marginBottom: 8,
  },
  itemType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 2,
  },
  itemBrand: {
    fontSize: 12,
    color: '#6C757D',
    fontStyle: 'italic',
  },
  outfitMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  outfitOccasion: {
    fontSize: 12,
    color: '#495057',
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  outfitSeason: {
    fontSize: 12,
    color: '#495057',
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
