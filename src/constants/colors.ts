export const Colors = {
  primary: '#FF6B9D',
  primaryLight: '#FF8FB1',
  primaryDark: '#E55A8A',
  secondary: '#4ECDC4',
  secondaryLight: '#6EDDD6',
  secondaryDark: '#3DB8B0',
  
  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  backgroundTertiary: '#F1F3F4',
  
  // Text colors
  text: '#1A1A1A',
  textSecondary: '#6C757D',
  textTertiary: '#ADB5BD',
  textInverse: '#FFFFFF',
  
  // Status colors
  success: '#28A745',
  warning: '#FFC107',
  error: '#DC3545',
  info: '#17A2B8',
  
  // Border colors
  border: '#E9ECEF',
  borderLight: '#F8F9FA',
  
  // Shadow colors
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',
  
  // Gradient colors
  gradientStart: '#FF6B9D',
  gradientEnd: '#4ECDC4',
  
  // Fashion-specific colors
  fashionPink: '#FF6B9D',
  fashionTeal: '#4ECDC4',
  fashionPurple: '#9B59B6',
  fashionOrange: '#F39C12',
  fashionBlue: '#3498DB',
  fashionGreen: '#2ECC71',
  fashionRed: '#E74C3C',
  fashionYellow: '#F1C40F',
} as const;

export type ColorKey = keyof typeof Colors; 