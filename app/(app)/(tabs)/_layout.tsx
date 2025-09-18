import { Tabs } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { Home, Search, Plus, User, Bell, LayoutList } from 'lucide-react-native';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNotifications } from '../../../contexts/NotificationContext';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Componente para o ícone de sino com contador de notificações
const bellIcon = (size: number, color: string, notificationCount: number) => {
  return (
    <View style={styles.iconContainer}>
      <Bell size={size} color={color} />
      {notificationCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
        </View>
      )}
    </View>
  );
};

export default function TabLayout() {
  const { subscription, loading } = useAuth();
  const { unreadCount, refetch } = useNotifications();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    refetch();
  }, [refetch]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // A variável isPaidUser foi mantida, mas não está sendo usada para controlar a renderização dos ícones
  const isPro = subscription?.plan === 'pro';
  const isEnterprise = subscription?.plan === 'enterprise';
  const isPaidUser = isPro || isEnterprise;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: insets.bottom,
          paddingTop: 8,
          height: 60 + insets.bottom,
        },
      }}
    >
      {/* 1. Início */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />

      {/* 2. Transfers */}
      <Tabs.Screen
        name="transfers"
        options={{
          title: 'Transfers',
          tabBarIcon: ({ size, color }) => (
            <Search size={size} color={color} />
          ),
        }}
      />

      {/* 3. Criar */}
      <Tabs.Screen
        name="create"
        options={{
          title: 'Criar',
          tabBarIcon: ({ size, color }) => (
            <Plus size={size} color={color} />
          ),
        }}
      />

      {/* 4. Dashboard */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => (
            <LayoutList size={size} color={color} />
          ),
        }}
      />

      {/* 5. Notificações */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notificações',
          tabBarIcon: ({ size, color }) => bellIcon(size, color, unreadCount),
        }}
      />
      
      {/* 6. Perfil */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});