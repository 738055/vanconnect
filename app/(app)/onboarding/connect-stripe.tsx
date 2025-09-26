// Em: app/(app)/onboarding/connect-stripe.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { WebView } from 'react-native-webview';
import { Banknote } from 'lucide-react-native';

export default function ConnectStripeScreen() {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stripeOnboardingUrl, setStripeOnboardingUrl] = useState<string | null>(null);
  const router = useRouter();

  const handleConnectStripe = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-account-link');
      if (error) {
        throw error;
      }
      setStripeOnboardingUrl(data.url);
    } catch (error: any) {
      console.error('Falha ao invocar a Edge Function:', JSON.stringify(error, null, 2));
      Alert.alert(
        'Erro de Comunicação',
        `Não foi possível comunicar com o servidor. Detalhes: ${error.message || 'Erro desconhecido.'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    const siteUrl = process.env.EXPO_PUBLIC_SITE_URL;

    if (siteUrl && url.includes(siteUrl)) {
      setStripeOnboardingUrl(null); // Fecha a WebView

      // ✅ CORREÇÃO: Redireciona para o ecrã de conclusão para verificação final.
      if (url.includes('/onboarding-complete')) {
        router.replace('/(app)/onboarding-complete');
      } else if (url.includes('/onboarding-failed')) {
        router.replace('/(app)/onboarding-failed');
      }
    }
  };
  
  // O resto do ficheiro permanece igual...
  if (stripeOnboardingUrl) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <WebView
          source={{ uri: stripeOnboardingUrl }}
          onNavigationStateChange={handleNavigationStateChange}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Banknote size={48} color="#4f46e5" />
        <Text style={styles.title}>Conecte-se para Receber</Text>
        <Text style={styles.description}>
          Para receber pagamentos pelos seus transfers, precisa de conectar uma conta Stripe. O processo é seguro e gerido pela Stripe.
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleConnectStripe} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Conectar com Stripe</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: 24 },
  content: { alignItems: 'center', maxWidth: 400, width: '100%', backgroundColor: '#fff', padding: 32, borderRadius: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginTop: 16, marginBottom: 8, textAlign: 'center' },
  description: { fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  button: { backgroundColor: '#4f46e5', paddingVertical: 16, borderRadius: 12, alignItems: 'center', width: '100%' },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});