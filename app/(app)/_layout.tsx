import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function AppLayout() {
  const { user, profile, subscription, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Adiciona logs para depuração
    console.log('--- A VERIFICAR A ROTA ---');
    console.log(`Carregamento: ${loading}, Utilizador: ${!!user}, Perfil: ${!!profile}`);
    if (profile) {
      console.log(`Status do Perfil: ${profile.status}, CPF/CNPJ do Perfil: ${profile.cpf_cnpj}`);
    }

    if (loading) {
      console.log('-> DECISÃO: A aguardar, a carregar...');
      return; // Aguarda o fim do carregamento
    }

    if (!user) {
      console.log("-> DECISÃO: Redirecionar para /login");
      router.replace('/(auth)/login');
      return;
    }

    if (user && profile) {
      // ETAPA 1: O status é 'onboarding' ou o perfil está incompleto?
      // Esta verificação é a mais importante e vem primeiro.
      if (profile.status === 'onboarding' || !profile.cpf_cnpj) {
        console.log("-> DECISÃO: Status 'onboarding' ou perfil incompleto. A redirecionar para /complete-profile");
        router.replace('/(auth)/complete-profile');
        return;
      }
      
      // ETAPA 2: O cadastro está em análise?
      if (profile.status === 'pending') {
        console.log("-> DECISÃO: Status 'pending'. A redirecionar para /pending");
        router.replace('/(auth)/pending');
        return;
      }

      // ETAPA 3: O cadastro foi rejeitado?
      if (profile.status === 'rejected') {
        console.log("-> DECISÃO: Status 'rejeitado'. A redirecionar para /rejected");
        router.replace('/(auth)/rejected');
        return;
      }

      // ETAPA 4: Está aprovado, mas sem um plano pago?
      if (profile.status === 'approved' && subscription?.plan === 'free') {
        console.log("-> DECISÃO: Aprovado, plano free. A redirecionar para /subscription");
        router.replace('/(app)/subscription');
        return;
      }

      console.log("-> DECISÃO: Acesso permitido à aplicação.");
    }
  }, [user, profile, subscription, loading, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1e293b" />
      </View>
    );
  }

  // Se todas as verificações passarem, o utilizador pode aceder à aplicação.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="subscription" />
    </Stack>
  );
}