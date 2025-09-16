import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function IndexScreen() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/(auth)/welcome');
      } else if (profile?.status === 'pending') {
        router.replace('/(auth)/pending');
      } else if (profile?.status === 'approved') {
        router.replace('/(app)/(tabs)');
      } else if (profile?.status === 'rejected') {
        router.replace('/(auth)/rejected');
      }
    }
  }, [user, profile, loading, router]);

  return <View style={{ flex: 1, backgroundColor: '#f8fafc' }} />;
}