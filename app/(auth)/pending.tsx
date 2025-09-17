import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, RefreshCw } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';

export default function PendingScreen() {
  const { signOut, profile, refreshProfile, loading } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // useFocusEffect é ótimo para revalidar dados quando a tela fica em foco.
  useFocusEffect(
    useCallback(() => {
      // Apenas atualiza se o perfil já carregado for 'pending'
      if (profile?.status === 'pending') {
        handleManualRefresh();
      }
    }, [profile?.status])
  );

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshProfile();
    setIsRefreshing(false);
  };

  // Mostra um loading inicial enquanto o perfil não foi carregado
  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1e293b" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Clock size={48} color="#f59e0b" />
        <Text style={styles.title}>Cadastro em Análise</Text>
        <Text style={styles.description}>
          A sua conta está a ser analisada. Assim que for aprovado, será redirecionado automaticamente.
        </Text>

        <TouchableOpacity style={styles.refreshButton} onPress={handleManualRefresh} disabled={isRefreshing}>
          {isRefreshing ? (
            <ActivityIndicator color="#2563eb" />
          ) : (
            <>
              <RefreshCw size={16} color="#2563eb" />
              <Text style={styles.refreshButtonText}>Verificar Status</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <Text style={styles.logoutButtonText}>Sair da Conta</Text>
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
    refreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#eff6ff',
      paddingVertical: 14,
      borderRadius: 12,
      width: '100%',
      gap: 8,
      marginBottom: 16,
    },
    refreshButtonText: {
      color: '#2563eb',
      fontWeight: '600',
      fontSize: 16,
    },
    logoutButton: { 
      paddingVertical: 12, 
      paddingHorizontal: 24, 
      borderRadius: 8, 
      borderWidth: 1, 
      borderColor: '#e2e8f0' 
    },
    logoutButtonText: { color: '#64748b', fontWeight: '500' },
});