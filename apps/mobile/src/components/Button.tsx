import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme';

type ButtonVariant = 'primary' | 'accent' | 'amber' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const variantBg: Record<ButtonVariant, string> = {
    primary: colors.primary,
    accent: colors.accent,
    amber: colors.highlight,
    outline: colors.surface,
    ghost: 'transparent',
    danger: colors.danger,
  };

  const variantText: Record<ButtonVariant, string> = {
    primary: colors.textOnPrimary,
    accent: colors.textOnPrimary,
    amber: colors.textOnPrimary,
    outline: colors.primary,
    ghost: colors.primary,
    danger: colors.textOnPrimary,
  };

  const sizeStyles: Record<ButtonSize, ViewStyle> = {
    sm: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.md },
    md: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: radius.md },
    lg: { paddingVertical: 15, paddingHorizontal: 22, borderRadius: radius.lg },
  };

  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 16 : 15;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        {
          backgroundColor: variantBg[variant],
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: variant === 'outline' ? colors.primary : 'transparent',
          opacity: isDisabled ? 0.55 : pressed ? 0.88 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantText[variant]} />
      ) : (
        <>
          {icon ? (
            <Ionicons
              name={icon}
              size={size === 'sm' ? 16 : 18}
              color={variantText[variant]}
              style={styles.icon}
            />
          ) : null}
          <Text
            style={[
              styles.label,
              { color: variantText[variant], fontSize },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  icon: {
    marginTop: 1,
  },
  label: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
