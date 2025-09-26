import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle, XCircle } from 'lucide-react-native';

export default function OnboardingCompleteScreen() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyStripeAccount = async () => {
      try {
        // Chama a sua função de backend para verificar o status
        const { data, error } = await supabase.functions.invoke('get-stripe-account-status');
        if (error) throw error;
        
        // Se a função retornar que o cadastro está completo...
        if (data.onboardingComplete) {
          setStatus('success');
          await refreshProfile(); // Atualiza os dados do perfil na aplicação
          
          // Aguarda 2 segundos para o utilizador ver a mensagem de sucesso
          setTimeout(() => {
            router.replace('/(app)/(tabs)'); // Redireciona para a tela principal
          }, 2000);
        } else {
          // Se a Stripe informar que o cadastro não foi concluído
          throw new Error('O processo de cadastro na Stripe não foi finalizado.');
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message);
        console.error("Erro ao verificar conta Stripe:", err);
      }
    };
    verifyStripeAccount();
  }, []);

  // O resto do ficheiro para renderizar as mensagens de loading, sucesso ou erro...
  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <ActivityIndicator size="large" color="#1e293b" />
            <Text style={styles.message}>A finalizar a sua conexão...</Text>
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