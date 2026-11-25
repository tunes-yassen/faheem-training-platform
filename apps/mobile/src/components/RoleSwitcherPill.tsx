import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { getHomeRouteForRole, useAuth } from '@/context/AuthContext';
import { colors, radius, spacing } from '@/theme';
import { UserRole } from '@/types';

const ROLES: { key: UserRole; label: string }[] = [
  { key: 'STUDENT', label: 'طالب' },
  { key: 'PARENT', label: 'ولي أمر' },
  { key: 'TRAINEE', label: 'متدرب' },
  { key: 'TUTOR', label: 'معلم' },
  { key: 'TRAINER', label: 'مدرب' },
  { key: 'COORDINATOR', label: 'منسق' },
  { key: 'SUPER_ADMIN', label: 'الإدارة' },
];

export function RoleSwitcherPill() {
  const { role, switchRole } = useAuth();
  const router = useRouter();

  const handleSwitch = (nextRole: UserRole) => {
    if (nextRole === role) return;
    switchRole(nextRole);
    router.replace(getHomeRouteForRole(nextRole));
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {ROLES.map((item) => {
        const active = role === item.key;
        return (
          <Pressable
            key={item.key}
            onPress={() => handleSwitch(item.key)}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    padding: 3,
    gap: 4,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.textOnPrimary,
  },
});
