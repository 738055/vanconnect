import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';

export default function OnboardingFailedScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <AlertTriangle size={48} color="#f59e0b" />
        <Text style={styles.message}>Conexão Interrompida</Text>
        <Text style={styles.subtitle}>
          O processo de conexão com o Stripe não foi concluído. Por favor, tente novamente.
        </Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.replace('/(app)/onboarding/connect-stripe')}
        >
          <Text style={styles.buttonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
// Os estilos podem ser os mesmos da tela de sucesso, se desejar.
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  content: { alignItems: 'center', padding: 24, gap: 16 },
  message: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 24 },
  button: {
    marginTop: 24,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});