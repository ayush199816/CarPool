// Theme colors
export const colors = {
  // Primary Colors
  primary: '#0B1F3A',        // Navy Blue
  primaryLight: '#1E3A5F',   // Lighter Navy
  primaryDark: '#051123',    // Darker Navy
  
  // Secondary Colors (CTAs and Highlights)
  secondary: '#0A84FF',      // Flame Orange
  secondaryLight: '#EAF4FF', // Lighter Orange
  secondaryDark: '#005BBB',  // Darker Orange
  
  // Accent Colors
  accent: '#5AC8FA',         // Amber Yellow
  accentLight: '#EAF4FF',    // Lighter Amber
  accentDark: '#1E3A5F',     // Darker Amber
  
  // UI Colors
  background: '#FFFFFF',     // Soft Gray
  card: '#FFFFFF',           // White
  text: '#0B1F3A',           // Almost Black
  textSecondary: '#4A607A',  // Secondary Text
  border: '#D6E4F0',         // Cool Gray Blue
  white: '#FFFFFF',
  black: '#000000',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FFC107',
  info: '#2196F3',
  danger: '#F44336',
  
  // Gradient Colors
  gradientOrangeYellowRed: ['#0A84FF', '#5AC8FA', '#0A84FF', '#005BBB'], // Orange to Yellow to Red gradient
  gradientOrangeRed: ['#0A84FF', '#005BBB'], // Orange to Red gradient
  gradientYellowOrange: ['#EAF4FF', '#0A84FF'], // Yellow to Orange gradient
  
  // Additional UI Colors
  inputBackground: '#FFFFFF',
  inputBorder: '#D6E4F0',
  shadow: 'rgba(11, 31, 58, 0.1)',
  
  // Grayscale
  gray: '#8E8E93',
  lightGray: '#F2F2F7',
  darkGray: '#636366',
  
  // Status Colors
  notification: '#FF3B30'
};

// Feature flags
export const featureFlags = {
  showMaps: true,  // Temporarily disable maps
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
