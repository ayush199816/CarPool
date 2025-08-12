// Theme colors
export const colors = {
  // Primary Colors
  primary: '#0B1F3A',        // Navy Blue
  primaryLight: '#1E3A5F',   // Lighter Navy
  primaryDark: '#051123',    // Darker Navy
  
  // Secondary Colors (CTAs and Highlights)
  secondary: '#FF5722',      // Flame Orange
  secondaryLight: '#FF8A50', // Lighter Orange
  secondaryDark: '#E64A19',  // Darker Orange
  
  // Accent Colors
  accent: '#FFC107',         // Amber Yellow
  accentLight: '#FFD54F',    // Lighter Amber
  accentDark: '#FFA000',     // Darker Amber
  
  // UI Colors
  background: '#F5F5F5',     // Soft Gray
  card: '#FFFFFF',           // White
  text: '#212121',           // Almost Black
  textSecondary: '#546E7A',  // Secondary Text
  border: '#B0BEC5',         // Cool Gray Blue
  white: '#FFFFFF',
  black: '#000000',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FFC107',
  info: '#2196F3',
  danger: '#F44336',
  
  // Gradient Colors
  gradientOrangeYellowRed: ['#FF5722', '#FF9800', '#FF5722', '#F44336'], // Orange to Yellow to Red gradient
  gradientOrangeRed: ['#FF5722', '#F44336'], // Orange to Red gradient
  gradientYellowOrange: ['#FFC107', '#FF9800'], // Yellow to Orange gradient
  
  // Additional UI Colors
  inputBackground: '#FFFFFF',
  inputBorder: '#B0BEC5',
  shadow: 'rgba(11, 31, 58, 0.1)',
  
  // Grayscale
  gray: '#8E8E93',
  lightGray: '#F2F2F7',
  darkGray: '#636366',
  
  // Status Colors
  notification: '#FF3B30'
};

// Font sizes
export const fontSizes = {
  small: 12,
  medium: 14,
  large: 16,
  xlarge: 18,
  xxlarge: 20,
  xxxlarge: 24,
};

// Spacing
export const spacing = {
  xsmall: 4,
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
  xxlarge: 48,
};

// Border radius
export const borderRadius = {
  small: 4,
  medium: 8,
  large: 12,
  xlarge: 16,
  pill: 999,
};

// Shadows
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export default {
  colors,
  fontSizes,
  spacing,
  borderRadius,
  shadows,
};
