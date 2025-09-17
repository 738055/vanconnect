import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import Toast from 'react-native-toast-message';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationProvider } from '../contexts/NotificationContext'; // ✅ IMPORTAÇÃO DO NOVO CONTEXTO DE NOTIFICAÇÕES

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider> {/* ✅ NOVO: Adicione o NotificationProvider aqui */}
          <ProtectedLayout />
        </NotificationProvider>
      </AuthProvider>
      <Toast />
    </QueryClientProvider>
  );
}

function ProtectedLayout() {
  const { isAuthenticated, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';

    if (loading) return;

    if (!isAuthenticated) {
      if (!inAuthGroup) {
        router.replace('/(auth)/welcome');
      }
    } else if (isAuthenticated && profile) {
      const currentRoute = segments.join('/');

      switch (profile.status) {
        case 'onboarding':
          if (currentRoute !== '(auth)/complete-profile') {
            router.replace('/(auth)/complete-profile');
          }
          break;
        case 'pending':
          if (currentRoute !== '(auth)/pending') {
            router.replace('/(auth)/pending');
          }
          break;
        case 'rejected':
          if (currentRoute !== '(auth)/rejected') {
            router.replace('/(auth)/rejected');
          }
          break;
        case 'approved':
          if (!inAppGroup) {
            router.replace('/(app)/(tabs)');
          }
          break;
        default:
          if (currentRoute !== '(auth)/login') {
            router.replace('/(auth)/login');
          }
      }
    } else if (isAuthenticated && !profile) {
        if (segments[1] !== 'complete-profile') {
            router.replace('/(auth)/complete-profile');
        }
    }
  }, [isAuthenticated, profile, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1e293b" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}