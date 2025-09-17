import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import Toast from 'react-native-toast-message';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AuthProvider>
      <ProtectedLayout />
    </AuthProvider>
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
      // ✅ LÓGICA DE VERIFICAÇÃO ADICIONADA AQUI
      // O `segments[1]` se refere ao nome do arquivo da tela dentro do grupo (auth)
      // Ex: para a rota /(auth)/pending, segments[0] é '(auth)' e segments[1] é 'pending'
      switch (profile.status) {
        case 'onboarding':
          if (segments[1] !== 'complete-profile') {
            router.replace('/(auth)/complete-profile');
          }
          break;
        case 'pending':
          if (segments[1] !== 'pending') {
            router.replace('/(auth)/pending');
          }
          break;
        case 'rejected':
          if (segments[1] !== 'rejected') {
            router.replace('/(auth)/rejected');
          }
          break;
        case 'approved':
          if (!inAppGroup) {
            router.replace('/(app)/(tabs)');
          }
          break;
        default:
          // Se o status for nulo ou desconhecido, mas o usuário estiver logado
          // pode significar que o perfil não foi criado corretamente.
          if (segments[1] !== 'complete-profile') {
             router.replace('/(auth)/complete-profile');
          }
      }
    } else if (isAuthenticated && !profile) {
        // Caso raro: usuário logado mas sem perfil. Envia para completar.
        if (segments[1] !== 'complete-profile') {
            router.replace('/(auth)/complete-profile');
        }
    }
  }, [isAuthenticated, profile, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <Toast />
    </>
  );
}