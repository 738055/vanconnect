import { Redirect, Stack, useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function AppLayout() {
  const { profile, loading, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      // Se não está a carregar e não há sessão, redireciona para a autenticação.
      router.replace('/(auth)/welcome');
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!session) {
    // Redireciona para o fluxo de autenticação se não estiver logado
    return <Redirect href="/(auth)/welcome" />;
  }

  // Lógica de redirecionamento com base no status do perfil
  if (profile) {
    if (profile.status === 'incomplete') {
      return <Redirect href="/(auth)/complete-profile" />;
    }
    if (profile.status === 'pending') {
      return <Redirect href="/(auth)/pending" />;
    }
    if (profile.status === 'rejected') {
      return <Redirect href="/(auth)/rejected" />;
    }
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="edit-profile" options={{ title: 'Editar Perfil' }}/>
      <Stack.Screen name="my-participations" options={{ headerShown: false }} />
      <Stack.Screen name="my-transfers" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/connect-stripe" options={{ presentation: 'modal', title: 'Conectar Conta Stripe' }}/>
      <Stack.Screen name="user-profile/[id]" options={{ title: 'Perfil do Usuário' }} />
      <Stack.Screen name="transfer-details/[id]" options={{ title: 'Detalhes do Transfer' }} />
      <Stack.Screen name="vehicles/index" options={{ title: 'Meus Veículos' }} />
      <Stack.Screen name="vehicles/create" options={{ presentation: 'modal', title: 'Adicionar Veículo' }} />
      <Stack.Screen name="booking/add-passengers" options={{ presentation: 'modal', title: 'Adicionar Passageiros' }} />
      <Stack.Screen name="booking/pix-payment" options={{ presentation: 'modal', title: 'Pagamento PIX' }} />
    </Stack>
  );
}

