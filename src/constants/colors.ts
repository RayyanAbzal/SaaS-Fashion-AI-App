export const Colors = {
  // Primary Colors
  primary: '#6366F1', // Indigo
  secondary: '#8B5CF6', // Purple
  accent: '#F59E0B', // Amber
  
  // Background Colors
  background: '#0F0F23', // Dark blue-black
  backgroundSecondary: '#1E1E3F', // Dark blue-gray
  backgroundGlass: 'rgba(255, 255, 255, 0.1)',
  backgroundCard: 'rgba(255, 255, 255, 0.05)',
  
  // Text Colors
  text: '#FFFFFF', // Pure White
  textSecondary: '#E2E8F0', // Light gray
  textTertiary: '#94A3B8', // Medium gray
  textMuted: '#64748B', // Dark gray
  textInverse: '#0F0F23', // Dark for light backgrounds
  
  // Status Colors
  success: '#10B981', // Emerald
  warning: '#F59E0B', // Amber
  error: '#EF4444', // Red
  info: '#3B82F6', // Blue
  
  // Social Colors
  like: '#EC4899', // Pink
  love: '#F43F5E', // Rose
  fire: '#F97316', // Orange
  cool: '#06B6D4', // Cyan
  
  // UI Colors
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: '#334155',
  borderGlass: 'rgba(255, 255, 255, 0.1)',
  shadow: '#000000',
  shadowDark: 'rgba(0, 0, 0, 0.5)',
  shadowLight: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  
  // Gradient Colors
  gradientStart: '#6366F1', // Indigo
  gradientEnd: '#8B5CF6', // Purple
  gradientPurple: '#8B5CF6',
  gradientBlue: '#3B82F6',
  gradientGreen: '#10B981',
  gradientOrange: '#F59E0B',
  
  // Confidence Colors
  confidenceHigh: '#10B981', // Emerald
  confidenceMedium: '#F59E0B', // Amber
  confidenceLow: '#EF4444', // Red
};

export const Gradients = {
  primary: [Colors.gradientStart, Colors.gradientEnd],
  purple: [Colors.gradientPurple, Colors.gradientStart],
  blue: [Colors.gradientBlue, Colors.gradientEnd],
  green: [Colors.gradientGreen, Colors.gradientEnd],
  orange: [Colors.gradientOrange, Colors.gradientStart],
  sunset: [Colors.gradientStart, Colors.gradientOrange],
  ocean: [Colors.gradientBlue, Colors.gradientEnd],
  fire: [Colors.gradientOrange, Colors.gradientStart],
  cool: [Colors.gradientEnd, Colors.gradientBlue],
  glass: [Colors.backgroundGlass, 'rgba(255, 255, 255, 0.05)'],
};

// Simple gradient component for Expo Go compatibility
export const createGradientStyle = (colors: string[], direction: 'horizontal' | 'vertical' = 'vertical') => {
  return {
    backgroundColor: colors[0], // Fallback color
    // For Expo Go, we'll use a solid color as fallback
    // In a development build, you can use react-native-linear-gradient
  };
}; 