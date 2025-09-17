import { Stack } from 'expo-router';
import React from 'react';

export default function MyTransfersLayout() {
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
          title: 'Meus Transfers',
        }}
      />
      {/* ✅ TELA DE DETALHES ADICIONADA AQUI */}
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Gerenciar Transfer',
        }}
      />
    </Stack>
  );
}