import { Stack } from 'expo-router';
import React from 'react';

export default function ParticipationLayout() {
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
        name="[id]/add-passengers"
        options={{
          title: 'Dados dos Passageiros',
        }}
      />
    </Stack>
  );
}