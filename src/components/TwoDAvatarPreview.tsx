// 2D Avatar Preview - Body type silhouettes with clothing overlays
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { OutfitItem } from '../services/oracleService';
import { UserAvatar } from '../services/enhancedOracleService';
import { HybridVirtualTryOnService, FitPrediction } from '../services/hybridVirtualTryOnService';

const { width } = Dimensions.get('window');

interface TwoDAvatarPreviewProps {
  items: OutfitItem[];
  userAvatar?: UserAvatar;
  onItemPress?: (item: OutfitItem) => void;
  showFitPrediction?: boolean;
}

export default function TwoDAvatarPreview({
  items,
  userAvatar,
  onItemPress,
  showFitPrediction = true,
}: TwoDAvatarPreviewProps) {
  const [fitPredictions, setFitPredictions] = React.useState<{ [itemId: string]: FitPrediction }>({});
  const [isLoading, setIsLoading] = React.useState(true);

  // Safety check for items
  if (!items || !Array.isArray(items) || items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.noItemsContainer}>
          <Ionicons name="shirt" size={60} color={Colors.backgroundSecondary} />
          <Text style={styles.noItemsText}>No items to preview</Text>
        </View>
      </View>
    );
  }

  // Load fit predictions when component mounts or items change
  React.useEffect(() => {
    const loadFitPredictions = async () => {
      if (userAvatar && showFitPrediction) {
        setIsLoading(true);
        try {
          const result = await HybridVirtualTryOnService.getVirtualTryOnResults(items, userAvatar);
          setFitPredictions(result.fitPredictions);
        } catch (error) {
          console.error('Error loading fit predictions:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadFitPredictions();
  }, [items, userAvatar, showFitPrediction]);

  const getBodyDimensions = () => {
    if (!userAvatar) {
      return {
        height: 160,
        shoulderWidth: 40,
        waistWidth: 35,
        hipWidth: 42,
        chestWidth: 38,
      };
    }

    const { height: userHeight, weight, waist } = userAvatar.measurements;
    const { bodyType } = userAvatar;
    
    // Calculate proportional dimensions based on height and weight
    const heightRatio = userHeight / 170; // Normalize to 170cm baseline
    const weightRatio = weight / 70; // Normalize to 70kg baseline
    
    const baseHeight = 160;
    const scaledHeight = baseHeight * heightRatio;
    
    // Calculate widths based on body type and measurements
    let shoulderWidth, waistWidth, hipWidth, chestWidth;
    
    switch (bodyType) {
      case 'pear':
        shoulderWidth = 35 * heightRatio;
        waistWidth = (waist * 0.8) * heightRatio; // Convert inches to proportional width
        hipWidth = waistWidth * 1.3;
        chestWidth = 32 * heightRatio;
        break;
      case 'apple':
        shoulderWidth = 42 * heightRatio;
        waistWidth = (waist * 0.9) * heightRatio;
        hipWidth = waistWidth * 1.1;
        chestWidth = 40 * heightRatio;
        break;
      case 'hourglass':
        shoulderWidth = 38 * heightRatio;
        waistWidth = (waist * 0.7) * heightRatio;
        hipWidth = waistWidth * 1.4;
        chestWidth = 36 * heightRatio;
        break;
      case 'rectangle':
      default:
        shoulderWidth = 36 * heightRatio;
        waistWidth = (waist * 0.8) * heightRatio;
        hipWidth = waistWidth * 1.1;
        chestWidth = 34 * heightRatio;
        break;
    }
    
    return {
      height: Math.max(120, Math.min(200, scaledHeight)),
      shoulderWidth: Math.max(25, Math.min(50, shoulderWidth)),
      waistWidth: Math.max(20, Math.min(60, waistWidth)),
      hipWidth: Math.max(25, Math.min(70, hipWidth)),
      chestWidth: Math.max(25, Math.min(50, chestWidth)),
    };
  };

  const getClothingOverlay = (item: OutfitItem) => {
    const category = item.category.toLowerCase();
    
    if (category.includes('top') || category.includes('shirt') || category.includes('blouse')) {
      return styles.topOverlay;
    } else if (category.includes('bottom') || category.includes('pant') || category.includes('jean')) {
      return styles.bottomOverlay;
    } else if (category.includes('dress')) {
      return styles.dressOverlay;
    } else if (category.includes('shoe') || category.includes('sneaker')) {
      return styles.shoeOverlay;
    }
    
    return styles.defaultOverlay;
  };

  const getBodyTypeSilhouette = () => {
    if (!userAvatar) return 'rectangle';
    return userAvatar.bodyType;
  };

  const getFitPrediction = (item: OutfitItem) => {
    if (!userAvatar || !showFitPrediction) {
      return { status: 'unknown', color: Colors.textSecondary, icon: 'help-circle' };
    }

    // Use the virtual try-on service predictions if available
    const prediction = fitPredictions[item.id];
    if (prediction) {
      const statusMap = {
        'perfect': { status: 'perfect', color: Colors.success, icon: 'checkmark-circle' },
        'fitted': { status: 'good', color: Colors.success, icon: 'checkmark-circle' },
        'loose': { status: 'loose', color: Colors.warning, icon: 'alert-circle' },
        'tight': { status: 'tight', color: Colors.error, icon: 'close-circle' },
      };
      
      return statusMap[prediction.fitType] || { status: 'good', color: Colors.success, icon: 'checkmark-circle' };
    }

    // Fallback to simple prediction
    const category = item.category.toLowerCase();
    const bodyType = userAvatar.bodyType;
    
    if (category.includes('top') || category.includes('shirt')) {
      if (bodyType === 'apple' && category.includes('fitted')) {
        return { status: 'tight', color: Colors.warning, icon: 'alert-circle' };
      }
      return { status: 'good', color: Colors.success, icon: 'checkmark-circle' };
    }
    
    if (category.includes('bottom') || category.includes('pant')) {
      if (bodyType === 'pear' && category.includes('skinny')) {
        return { status: 'tight', color: Colors.warning, icon: 'alert-circle' };
      }
      return { status: 'good', color: Colors.success, icon: 'checkmark-circle' };
    }
    
    return { status: 'good', color: Colors.success, icon: 'checkmark-circle' };
  };

  const renderBodySilhouette = () => {
    const dimensions = getBodyDimensions();
    
    return (
      <View style={styles.avatarContainer}>
        <View style={styles.bodySilhouette}>
          {/* Head */}
          <View style={[
            styles.head,
            {
              width: dimensions.shoulderWidth * 0.6,
              height: dimensions.height * 0.12,
              top: 0,
            }
          ]} />
          
          {/* Neck */}
          <View style={[
            styles.neck,
            {
              width: dimensions.shoulderWidth * 0.4,
              height: dimensions.height * 0.05,
              top: dimensions.height * 0.12,
            }
          ]} />
          
          {/* Shoulders */}
          <View style={[
            styles.shoulders,
            {
              width: dimensions.shoulderWidth,
              height: dimensions.height * 0.08,
              top: dimensions.height * 0.17,
            }
          ]} />
          
          {/* Chest/Upper Torso */}
          <View style={[
            styles.chest,
            {
              width: dimensions.chestWidth,
              height: dimensions.height * 0.15,
              top: dimensions.height * 0.25,
            }
          ]} />
          
          {/* Waist */}
          <View style={[
            styles.waist,
            {
              width: dimensions.waistWidth,
              height: dimensions.height * 0.1,
              top: dimensions.height * 0.4,
            }
          ]} />
          
          {/* Hips */}
          <View style={[
            styles.hips,
            {
              width: dimensions.hipWidth,
              height: dimensions.height * 0.12,
              top: dimensions.height * 0.5,
            }
          ]} />
          
          {/* Thighs */}
          <View style={[
            styles.thighs,
            {
              width: dimensions.hipWidth * 0.8,
              height: dimensions.height * 0.15,
              top: dimensions.height * 0.62,
            }
          ]} />
          
          {/* Calves */}
          <View style={[
            styles.calves,
            {
              width: dimensions.hipWidth * 0.6,
              height: dimensions.height * 0.15,
              top: dimensions.height * 0.77,
            }
          ]} />
        </View>
        <Text style={styles.bodyTypeText}>
          {userAvatar?.bodyType ? userAvatar.bodyType.charAt(0).toUpperCase() + userAvatar.bodyType.slice(1) : 'Rectangle'} Body Type
        </Text>
      </View>
    );
  };

  const renderClothingItems = () => {
    return items.map((item, index) => {
      const fitPrediction = getFitPrediction(item);
      const overlayStyle = getClothingOverlay(item);
      
      return (
        <TouchableOpacity
          key={item.id || index}
          style={[styles.clothingItem, overlayStyle]}
          onPress={() => onItemPress?.(item)}
        >
          <Image source={{ uri: item.image }} style={styles.clothingImage} />
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.itemCategory}>{item.category}</Text>
            {fitPrediction.status !== 'unknown' && (
              <View style={styles.fitIndicator}>
                <Ionicons 
                  name={fitPrediction.icon as any} 
                  size={12} 
                  color={fitPrediction.color} 
                />
                <Text style={[styles.fitText, { color: fitPrediction.color }]}>
                  {fitPrediction.status}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>How it looks on you</Text>
        {isLoading && (
          <View style={styles.loadingIndicator}>
            <Ionicons name="refresh" size={16} color={Colors.primary} />
          </View>
        )}
      </View>
      
      {renderBodySilhouette()}
      
      <View style={styles.clothingContainer}>
        {renderClothingItems()}
      </View>
      
      <View style={styles.fitInfo}>
        <Ionicons name="information-circle" size={16} color={Colors.primary} />
        <Text style={styles.fitInfoText}>
          Fit predictions based on your {getBodyTypeSilhouette()} body type
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 20,
    padding: 20,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    flex: 1,
  },
  loadingIndicator: {
    padding: 4,
  },
  noItemsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noItemsText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  bodySilhouette: {
    width: 100,
    height: 200,
    position: 'relative',
    alignSelf: 'center',
  },
  head: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 50,
    position: 'absolute',
    left: '50%',
    marginLeft: -15,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  neck: {
    backgroundColor: Colors.backgroundSecondary,
    position: 'absolute',
    left: '50%',
    marginLeft: -8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  shoulders: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
    position: 'absolute',
    left: '50%',
    marginLeft: -25,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  chest: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 15,
    position: 'absolute',
    left: '50%',
    marginLeft: -20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  waist: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 10,
    position: 'absolute',
    left: '50%',
    marginLeft: -15,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  hips: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 15,
    position: 'absolute',
    left: '50%',
    marginLeft: -20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  thighs: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 10,
    position: 'absolute',
    left: '50%',
    marginLeft: -16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  calves: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    position: 'absolute',
    left: '50%',
    marginLeft: -12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  bodyTypeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    fontWeight: '500',
  },
  clothingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  clothingItem: {
    width: (width - 80) / 3,
    aspectRatio: 1,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clothingImage: {
    width: '100%',
    height: '70%',
    resizeMode: 'cover',
  },
  itemInfo: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    height: '30%',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 8,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  fitIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  fitText: {
    fontSize: 8,
    fontWeight: '500',
  },
  // Clothing overlay positions
  topOverlay: {
    position: 'absolute',
    top: 20,
    left: 10,
    right: 10,
    height: 40,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    height: 50,
  },
  dressOverlay: {
    position: 'absolute',
    top: 20,
    bottom: 20,
    left: 10,
    right: 10,
  },
  shoeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 20,
  },
  defaultOverlay: {
    position: 'absolute',
    top: '50%',
    left: 10,
    right: 10,
    height: 30,
  },
  fitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  fitInfoText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
