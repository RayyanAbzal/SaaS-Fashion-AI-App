import { CameraPhoto } from '@/types';
import { analyzeImageWithGoogle, VisionResponse } from './googleVisionService';

export interface ClothingItem {
  id: string;
  name: string;
  category: 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'shoes' | 'accessories';
  subcategory: string;
  color: string;
  colorHex?: string;
  colorConfidence: number;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  attributes: {
    pattern?: string;
    sleeveLength?: string;
    neckline?: string;
    fit?: string;
    material?: string;
  };
  style?: string;
  brand?: string;
}

export interface RecognitionResult {
  items: ClothingItem[];
  totalItems: number;
  processingTime: number;
  imageQuality: 'low' | 'medium' | 'high';
}

/**
 * Analyze a photo to detect and classify clothing items
 */
export const analyzeClothingPhoto = async (photo: CameraPhoto): Promise<RecognitionResult> => {
  try {
    const { analysis, processingTime }: VisionResponse = await analyzeImageWithGoogle(photo.uri);

    if (!analysis.isValidClothing) {
      throw new Error('The uploaded image does not appear to be a piece of clothing. Please try another photo.');
    }

    const clothingItem: ClothingItem = {
      id: new Date().toISOString(),
      name: analysis.description,
      category: analysis.category,
      subcategory: analysis.style,
      color: analysis.color,
      brand: analysis.brand,
      confidence: analysis.confidence,
      colorHex: '#000000',
      colorConfidence: analysis.confidence,
      boundingBox: { x: 0, y: 0, width: 1, height: 1 },
      attributes: {
        pattern: analysis.tags.includes('pattern') ? 'patterned' : 'solid',
        sleeveLength: 'unknown',
        neckline: 'unknown',
        fit: 'unknown',
        material: 'unknown'
      },
      style: analysis.style,
    };

    return {
      items: [clothingItem],
      totalItems: 1,
      processingTime,
      imageQuality: 'high',
    };
  } catch (error) {
    console.error('Error analyzing clothing photo:', error);
    if (error instanceof Error && error.message.includes('does not appear to be a piece of clothing')) {
      throw error;
    }
    throw new Error('Failed to analyze clothing photo. Please try again.');
  }
};

/**
 * Get detailed information about a specific clothing item
 */
export const getItemDetails = async (itemId: string): Promise<ClothingItem | null> => {
  console.warn(`getItemDetails is returning a mock value for itemId: ${itemId}`);
  return null;
};

/**
 * Suggest similar items based on the recognized clothing
 */
export const getSimilarItems = async (item: ClothingItem): Promise<ClothingItem[]> => {
  console.warn(`getSimilarItems is returning mock values.`);
  return [];
};

/**
 * Validate if the photo quality is sufficient for recognition
 */
export const validatePhotoQuality = (photo: CameraPhoto): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];

  if (photo.width < 300 || photo.height < 300) {
    issues.push('Image resolution is too low. Please use a clearer photo.');
  }

  const aspectRatio = photo.width / photo.height;
  if (aspectRatio < 0.5 || aspectRatio > 2) {
    issues.push('Image aspect ratio is not optimal. Try to frame the item centrally.');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
};