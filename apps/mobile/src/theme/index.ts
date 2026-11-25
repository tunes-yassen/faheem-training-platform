import { Platform } from 'react-native';

export const colors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  surfaceSoftTeal: '#F0FDFA',
  surfaceSoftSky: '#F0F9FF',
  surfaceSoftAmber: '#FFFBEB',

  primary: '#0D9488',
  primaryDark: '#0F766E',
  primaryLight: '#CCFBF1',

  accent: '#0EA5E9',
  accentDark: '#0284C7',
  accentLight: '#E0F2FE',

  highlight: '#F59E0B',
  highlightDark: '#D97706',
  highlightLight: '#FEF3C7',

  success: '#10B981',
  successLight: '#D1FAE5',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  indigo: '#6366F1',
  indigoLight: '#E0E7FF',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textOnPrimary: '#FFFFFF',

  border: '#E2E8F0',
  divider: '#F1F5F9',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 9999,
} as const;

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
    },
    android: {
      elevation: 3,
    },
    default: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
    },
  }),
  elevated: Platform.select({
    ios: {
      shadowColor: '#0D9488',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
    },
    android: {
      elevation: 6,
    },
    default: {
      shadowColor: '#0D9488',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
    },
  }),
};

export const typography = {
  h1: { fontSize: 26, fontWeight: '800' as const, lineHeight: 34, color: colors.textPrimary },
  h2: { fontSize: 20, fontWeight: '700' as const, lineHeight: 28, color: colors.textPrimary },
  h3: { fontSize: 17, fontWeight: '700' as const, lineHeight: 24, color: colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22, color: colors.textPrimary },
  bodyBold: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22, color: colors.textPrimary },
  caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18, color: colors.textSecondary },
  micro: { fontSize: 11, fontWeight: '600' as const, lineHeight: 16, color: colors.textMuted },
};
