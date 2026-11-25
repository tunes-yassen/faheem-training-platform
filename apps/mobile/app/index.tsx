import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { getHomeRouteForRole, useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';

export default function IndexScreen() {
  const { isAuthenticated, isHydrating, role } = useAuth();

  if (isHydrating) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return <Redirect href={getHomeRouteForRole(role)} />;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
