// Em: app/_layout.tsx

import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationProvider } from '../contexts/NotificationContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { StripeProvider } from '@stripe/stripe-react-native';
import { initializeStripe } from '../lib/stripe';

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Constrói a rota atual de forma fiável para comparação
    const currentRoute = segments.join('/');

    // Se não há sessão, vai para o ecrã de boas-vindas.
    if (!session) {
      if (!currentRoute.startsWith('(auth)')) {
        router.replace('/(auth)/welcome');
      }
      return;
    } 
    
    // Se há sessão e perfil, aplica as regras de redirecionamento.
    if (session && profile) {
      const inAppGroup = segments[0] === '(app)';

      // ✅ CORREÇÃO: Verifica se o utilizador já não está no ecrã de destino antes de redirecionar.
      if (profile.status === 'incomplete' && currentRoute !== '(auth)/complete-profile') {
        router.replace('/(auth)/complete-profile');
      } else if (profile.status === 'pending' && currentRoute !== '(auth)/pending') {
        router.replace('/(auth)/pending');
      } else if (profile.status === 'rejected' && currentRoute !== '(auth)/rejected') {
        router.replace('/(auth)/rejected');
      } else if (profile.status === 'approved') {
        if (!profile.stripe_onboarding_complete && currentRoute !== '(app)/onboarding/connect-stripe') {
          router.replace('/(app)/onboarding/connect-stripe');
        } else if (profile.stripe_onboarding_complete && !inAppGroup) {
          router.replace('/(app)/(tabs)');
        }
      }
    }
  }, [session, profile, loading, segments]);

  if (loading || (session && !profile)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e293b" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  useEffect(() => { initializeStripe(); }, []);

  return (
    <StripeProvider publishableKey={stripePublishableKey}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NotificationProvider>
            <RootLayoutNav />
            <Toast />
          </NotificationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    }
});