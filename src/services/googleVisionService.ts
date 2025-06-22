import { fileToBase64 } from '@/utils/fileUtils';

export interface VisionAnalysis {
  category: 'tops' | 'bottoms' | 'shoes' | 'accessories' | 'outerwear';
  color: string;
  style: string;
  brand?: string;
  season?: string;
  tags: string[];
  confidence: number;
  description: string;
  isValidClothing: boolean;
}

export interface VisionResponse {
  analysis: VisionAnalysis;
  processingTime: number;
}

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;
// ... existing code ...
