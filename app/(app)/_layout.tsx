import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { View, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { user, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Aguarda o carregamento inicial do estado de autenticação

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';

    if (!user) {
      // Se não há usuário e não estamos no fluxo de autenticação, redireciona para lá
      if (!inAuthGroup) {
        router.replace('/(auth)/welcome');
      }
    } else if (user) {
      // Se há usuário, verifica o status do perfil
      if (profile?.status === 'incomplete') {
        router.replace('/(auth)/complete-profile');
      } else if (profile?.status === 'pending') {
        router.replace('/(auth)/pending');
      } else if (profile?.status === 'rejected') {
        router.replace('/(auth)/rejected');
      } else if (profile?.status === 'approved') {
        // Se aprovado, verifica se conectou ao Stripe
        if (profile.stripe_onboarding_complete === false) {
          router.replace('/(app)/onboarding/connect-stripe');
        } else {
          // Se tudo estiver completo e não estivermos no grupo principal do app, redireciona para lá
          if (!inAppGroup) {
            router.replace('/(app)/(tabs)');
          }
        }
      }
    }
  }, [user, profile, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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