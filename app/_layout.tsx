import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '../contexts/AuthContext';
import { initializeStripe } from '../lib/stripe';
import Toast from 'react-native-toast-message';
import { Provider as PaperProvider } from 'react-native-paper';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    initializeStripe();
  }, []);

  return (
    <PaperProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
        <Toast />
      </AuthProvider>
    </PaperProvider>
  );
}