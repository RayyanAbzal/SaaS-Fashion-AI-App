import { CameraPhoto } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import OpenAIVisionService from './openaiVisionService';

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
    const startTime = Date.now();
    const visionService = OpenAIVisionService.getInstance();
    const { analysis } = await visionService.analyzeClothingImage(photo.uri);

    if (!analysis.isValidClothing) {
      throw new Error('The uploaded image does not appear to be a piece of clothing. Please try another photo.');
    }

    const clothingItem: ClothingItem = {
      id: new Date().toISOString(),
      name: analysis.description,
      category: analysis.category,
      subcategory: analysis.subcategory || 'general',
      color: analysis.color,
      brand: analysis.brand,
      confidence: analysis.confidence,
      colorHex: '#000000', // OpenAI Vision doesn't provide hex colors
      colorConfidence: 0.8, // OpenAI Vision doesn't provide color confidence
      boundingBox: { x: 0, y: 0, width: 1, height: 1 }, // OpenAI Vision doesn't provide bounding boxes
      attributes: {
        pattern: analysis.tags.find(tag => ['pattern', 'solid', 'striped', 'floral'].includes(tag)) || 'solid',
        sleeveLength: analysis.tags.find(tag => ['short-sleeve', 'long-sleeve', 'sleeveless'].includes(tag)) || 'unknown',
        neckline: analysis.tags.find(tag => ['v-neck', 'crew-neck', 'turtleneck'].includes(tag)) || 'unknown',
        fit: analysis.tags.find(tag => ['slim', 'regular', 'loose', 'oversized'].includes(tag)) || 'unknown',
        material: analysis.tags.find(tag => ['cotton', 'polyester', 'wool', 'leather', 'denim'].includes(tag)) || 'unknown'
      },
      style: analysis.style,
    };

    return {
      items: [clothingItem],
      totalItems: 1,
      processingTime: Date.now() - startTime,
      imageQuality: 'high', // OpenAI Vision doesn't provide image quality assessment
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
  try {
    if (!itemId) {
      console.warn('getItemDetails called with undefined itemId');
      return null;
    }

    const docRef = doc(db, 'clothing_items', itemId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.warn(`No clothing item found with id: ${itemId}`);
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data()
    } as ClothingItem;
  } catch (error) {
    console.error('Error fetching item details:', error);
    throw error;
  }
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