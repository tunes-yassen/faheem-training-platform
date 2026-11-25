import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing } from '@/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  tone?: 'default' | 'teal' | 'sky' | 'amber';
}

export function Card({ children, style, padded = true, tone = 'default' }: CardProps) {
  const toneBg =
    tone === 'teal'
      ? colors.surfaceSoftTeal
      : tone === 'sky'
      ? colors.surfaceSoftSky
      : tone === 'amber'
      ? colors.surfaceSoftAmber
      : colors.surface;

  const toneBorder =
    tone === 'teal'
      ? colors.primaryLight
      : tone === 'sky'
      ? colors.accentLight
      : tone === 'amber'
      ? colors.highlightLight
      : colors.border;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: toneBg, borderColor: toneBorder },
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    ...shadows.card,
  },
  padded: {
    padding: spacing.lg,
  },
});
