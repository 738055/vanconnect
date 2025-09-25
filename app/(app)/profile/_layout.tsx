// Em: app/(app)/profile/_layout.tsx

import { Stack } from 'expo-router';
import React from 'react';

export default function ProfileStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#1e293b',
        headerTitleStyle: { fontWeight: 'bold' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="wallet" options={{ title: 'Minha Carteira' }} />
      <Stack.Screen name="my-reviews" options={{ title: 'Minhas Avaliações' }} />
      <Stack.Screen name="pending-requests" options={{ title: 'Solicitações Pendentes' }} />
    </Stack>
  );
}