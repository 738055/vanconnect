import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import Toast from 'react-native-toast-message';
import { Provider as PaperProvider } from 'react-native-paper';
import { ActivityIndicator, View } from 'react-native';

// Este componente interno agora lida com a lógica de navegação
const ProtectedLayout = () => {
  const { user, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Se ainda estiver carregando os dados do usuário, não faz nada.
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    // Se não há usuário e ele não está na área de autenticação,
    // redireciona para a tela de boas-vindas.
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } 
    // Se há um usuário e seu perfil foi carregado...
    else if (user && profile) {
      // ✅ AQUI ESTÁ A LÓGICA FALTANTE
      // Se o status é 'onboarding', o usuário deve completar o perfil.
      if (profile.status === 'onboarding') {
        router.replace('/(auth)/complete-profile');
      }
      // Se o cadastro está pendente, ele vai para a tela de espera.
      else if (profile.status === 'pending') {
        router.replace('/(auth)/pending');
      }
      // Se foi rejeitado, vai para a tela de rejeitado.
      else if (profile.status === 'rejected') {
        router.replace('/(auth)/rejected');
      }
      // Se foi aprovado e ainda está na área de autenticação,
      // é hora de ir para a área principal do app.
      else if (profile.status === 'approved' && inAuthGroup) {
        router.replace('/(app)/(tabs)');
      }
    }
  }, [user, profile, loading, segments]);

  // Enquanto carrega, podemos mostrar um indicador para o usuário
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1e293b" />
      </View>
    );
  }

  // Quando não está carregando, renderiza as rotas definidas.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
};

export default function RootLayout() {
  // O seu useFrameworkReady e initializeStripe podem ficar aqui se necessário
  
  return (
    <PaperProvider>
      <AuthProvider>
        <ProtectedLayout />
        <StatusBar style="auto" />
        <Toast />
      </AuthProvider>
    </PaperProvider>
  );
}