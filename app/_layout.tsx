import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationProvider } from '../contexts/NotificationContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { user, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } 
    else if (user && profile) { 
      if (profile.status === 'incomplete' && segments[1] !== 'complete-profile') {
        router.replace('/(auth)/complete-profile');
      } else if (profile.status === 'pending' && segments[1] !== 'pending') {
        router.replace('/(auth)/pending');
      } else if (profile.status === 'rejected' && segments[1] !== 'rejected') {
        router.replace('/(auth)/rejected');
      } else if (profile.status === 'approved') {
        if (!profile.stripe_onboarding_complete && segments[1] !== 'onboarding') {
          router.replace('/(app)/onboarding/connect-stripe');
        } else if (profile.stripe_onboarding_complete && segments[0] !== '(app)') {
          router.replace('/(app)/(tabs)');
        }
      }
    }
  }, [user, profile, loading, segments]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <RootLayoutNav />
          <Toast />
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});