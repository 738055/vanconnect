// Em: app/(app)/_layout.tsx

import { Stack } from 'expo-router';
import React from 'react'; // ✅ Adicionado import do React

// O layout do app agora pode assumir que o utilizador já está autenticado e verificado.
// Toda a lógica de verificação foi removida para evitar conflitos.
export default function AppLayout() {
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