// Em: app/(app)/_layout.tsx

import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';

export default function AppLayout() {
  const { profile, loading, session } = useAuth();

  // 1. Mostrar um indicador de carregamento enquanto a sessão e o perfil são verificados.
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1e293b" />
      </View>
    );
  }

  // 2. Se não houver sessão após o carregamento, redirecionar para a tela de boas-vindas.
  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // 3. Se houver uma sessão, mas o perfil ainda estiver a ser carregado ou não existir,
  // mostrar o loading para evitar um piscar de tela.
  if (!profile) {
     return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1e293b" />
      </View>
    );
  }

  // 4. Lógica de redirecionamento com base no status do perfil
  if (profile.status === 'incomplete') {
    return <Redirect href="/(auth)/complete-profile" />;
  }
  if (profile.status === 'pending') {
    return <Redirect href="/(auth)/pending" />;
  }
  if (profile.status === 'rejected') {
    return <Redirect href="/(auth)/rejected" />;
  }
  if (profile.status === 'approved' && !profile.stripe_onboarding_complete) {
    return <Redirect href="/(app)/onboarding/connect-stripe" />;
  }

  // 5. Se tudo estiver correto (sessão ativa, perfil aprovado e Stripe conectado),
  // o utilizador pode aceder às telas da aplicação.
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: '#ffffff' }, headerTintColor: '#1e293b' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="edit-profile" options={{ title: 'Editar Perfil' }}/>
      <Stack.Screen name="my-participations" options={{ headerShown: false }} />
      <Stack.Screen name="my-transfers" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/connect-stripe" options={{ presentation: 'modal', title: 'Conectar Conta Stripe' }}/>
      <Stack.Screen name="user-profile/[id]" options={{ title: 'Perfil do Utilizador' }} />
      <Stack.Screen name="transfer-details/[id]" options={{ title: 'Detalhes do Transfer' }} />
      <Stack.Screen name="vehicles/index" options={{ title: 'Meus Veículos' }} />
      <Stack.Screen name="vehicles/create" options={{ presentation: 'modal', title: 'Adicionar Veículo' }} />
      <Stack.Screen name="booking/add-passengers" options={{ presentation: 'modal', title: 'Adicionar Passageiros' }} />
      <Stack.Screen name="my-participations/pix-payment" options={{ presentation: 'modal', title: 'Pagamento PIX' }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} /> 
    </Stack>
  );
}