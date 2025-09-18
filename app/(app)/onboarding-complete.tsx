import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase'; // Ajuste o caminho se necessário: ../../lib/supabase
import { useAuth } from '../../contexts/AuthContext'; // Ajuste o caminho se necessário: ../../contexts/AuthContext
import { CheckCircle, XCircle } from 'lucide-react-native';

// O nome do componente
function OnboardingCompleteScreen() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyStripeAccount = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-stripe-account-status');
        if (error) throw error;
        if (data.onboardingComplete) {
          setStatus('success');
          await refreshProfile(); 
          setTimeout(() => {
            router.replace('/(app)/(tabs)');
          }, 2000);
        } else {
          throw new Error(data.message || 'A verificação da conta Stripe falhou.');
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message);
        console.error(err);
      }
    };
    verifyStripeAccount();
  }, []);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <ActivityIndicator size="large" color="#1e293b" />
            <Text style={styles.message}>A verificar a sua conta Stripe...</Text>
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle size={48} color="#10b981" />
            <Text style={styles.message}>Conta conectada com sucesso!</Text>
            <Text style={styles.subtitle}>A redirecionar para o app...</Text>
          </>
        );
      case 'error':
        return (
          <>
            <XCircle size={48} color="#dc2626" />
            <Text style={styles.message}>Ocorreu um Erro</Text>
            <Text style={styles.subtitle}>{errorMessage}</Text>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => router.replace('/(app)/onboarding/connect-stripe')}
            >
              <Text style={styles.buttonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  content: { alignItems: 'center', padding: 24, gap: 16 },
  message: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#64748b', textAlign: 'center' },
  button: {
    marginTop: 24,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});

// ✅ ESTA É A LINHA CRÍTICA QUE ESTAVA A FALTAR
export default OnboardingCompleteScreen;