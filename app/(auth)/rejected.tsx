import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldAlert } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function RejectedScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth(); // Adicionado signOut
  const [reason, setReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRejectionReason = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('rejection_reason')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        if (data?.rejection_reason) {
          setReason(data.rejection_reason);
        }
      } catch (error) {
        console.error('Error fetching rejection reason:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRejectionReason();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login'); // Garante que o usuário vá para a tela de login
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ShieldAlert size={60} color="#dc2626" />
        <Text style={styles.title}>Cadastro Rejeitado</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color="#b91c1c" />
        ) : (
          <View style={styles.reasonBox}>
            <Text style={styles.message}>
              Infelizmente, não foi possível aprovar seu cadastro no momento.
            </Text>
            {reason && (
              <>
                <Text style={styles.reasonLabel}>Motivo:</Text>
                <Text style={styles.reasonText}>"{reason}"</Text>
              </>
            )}
          </View>
        )}

        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => router.push('/(auth)/complete-profile')}
        >
          <Text style={styles.retryButtonText}>Corrigir Informações</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={handleLogout} // Chama a função de logout
        >
          <Text style={styles.secondaryButtonText}>Sair</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  content: {
    width: '100%',
    padding: 24,
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#991b1b',
    marginTop: 8,
  },
  reasonBox: {
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  message: {
    fontSize: 16,
    color: '#b91c1c',
    textAlign: 'center',
    lineHeight: 24,
  },
  reasonLabel: {
    fontSize: 14,
    color: '#991b1b',
    fontWeight: 'bold',
    marginTop: 8,
  },
  reasonText: {
    fontSize: 16,
    color: '#7f1d1d',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dc2626'
  },
  secondaryButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: 'bold',
  },
});