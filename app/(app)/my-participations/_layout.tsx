// Em: app/(app)/my-participations/_layout.tsx

import { Stack } from 'expo-router';
import React from 'react';

export default function MyParticipationsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTintColor: '#1e293b',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Minhas Participações',
        }}
      />
      {/* ✅ CORREÇÃO: Adicionada a declaração do ecrã de pagamento */}
      <Stack.Screen
        name="pix-payment"
        options={{
          presentation: 'modal',
          title: 'Pagamento PIX',
        }}
      />
    </Stack>
  );
}