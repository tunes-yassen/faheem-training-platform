import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius } from '@/theme';

export type BadgeTone = 'teal' | 'sky' | 'amber' | 'success' | 'danger' | 'indigo' | 'slate';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  style?: StyleProp<ViewStyle>;
}

const TONE_STYLES: Record<BadgeTone, { bg: string; fg: string }> = {
  teal: { bg: colors.primaryLight, fg: colors.primaryDark },
  sky: { bg: colors.accentLight, fg: colors.accentDark },
  amber: { bg: colors.highlightLight, fg: colors.highlightDark },
  success: { bg: colors.successLight, fg: '#047857' },
  danger: { bg: colors.dangerLight, fg: '#B91C1C' },
  indigo: { bg: colors.indigoLight, fg: '#4338CA' },
  slate: { bg: colors.surfaceMuted, fg: colors.textSecondary },
};

export function Badge({ label, tone = 'teal', style }: BadgeProps) {
  const palette = TONE_STYLES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }, style]}>
      <Text style={[styles.text, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
