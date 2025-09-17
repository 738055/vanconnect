import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';

export default function VerifyEmailScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Mail size={60} color="#2563eb" />
        <Text style={styles.title}>Verifique seu E-mail</Text>
        <Text style={styles.message}>
          Enviamos um link de confirmação para o seu e-mail. Por favor, clique no link para ativar sua conta e continuar.
        </Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={styles.buttonText}>Voltar para o Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 24, alignItems: 'center', gap: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  message: { fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 24 },
  button: { marginTop: 24, backgroundColor: '#2563eb', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});