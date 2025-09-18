import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import * as WebBrowser from 'expo-web-browser';
import { CreditCard, LogOut } from 'lucide-react-native';

export default function ConnectStripeScreen() {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleConnectStripe = async () => {
    setLoading(true);
    try {
      // Chama a Edge Function que criamos
      const { data, error } = await supabase.functions.invoke('create-stripe-account-link', {
        method: 'POST',
      });
      
      if (error) throw error;

      if (data.url) {
        // Abre o link de onboarding do Stripe no navegador do app
        await WebBrowser.openBrowserAsync(data.url);
      } else {
        throw new Error('URL de conexão não recebida.');
      }
    } catch (error: any) {
      console.error('Erro ao conectar com Stripe:', error);
      Alert.alert('Erro', 'Não foi possível iniciar a conexão com o Stripe. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <CreditCard size={48} color="#4f46e5" />
        <Text style={styles.title}>Quase lá!</Text>
        <Text style={styles.description}>
          Seu cadastro foi aprovado! Para começar a receber pagamentos pelas suas viagens, conecte sua conta ao Stripe, nosso parceiro de pagamentos seguro.
        </Text>

        <TouchableOpacity 
            style={[styles.connectButton, loading && styles.disabledButton]} 
            onPress={handleConnectStripe} 
            disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.connectButtonText}>Conectar com Stripe</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <LogOut size={16} color="#64748b" />
          <Text style={styles.logoutButtonText}>Sair</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: 24 },
  content: { alignItems: 'center', maxWidth: 400, width: '100%' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginTop: 16, marginBottom: 8, textAlign: 'center' },
  description: { fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  connectButton: {
    backgroundColor: '#4f46e5', // Cor do Stripe
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.7,
  },
  connectButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  logoutButtonText: { color: '#64748b', fontWeight: '500' },
});