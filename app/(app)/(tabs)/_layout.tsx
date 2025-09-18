import { Tabs } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { Home, Search, Plus, User, Bell, Building2 as Building } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';
import { useNotifications } from '../../../contexts/NotificationContext';

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
  const { subscription } = useAuth();
  const { unreadCount } = useNotifications();

  const isPro = subscription?.plan === 'pro';
  const isEnterprise = subscription?.plan === 'enterprise';

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
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="transfers"
        options={{
          title: 'Transfers',
          tabBarIcon: ({ size, color }) => (
            <Search size={size} color={color} />
          ),
        }}
      />

      {(isPro || isEnterprise) ? (
        <Tabs.Screen
          name="create"
          options={{
            title: 'Criar',
            tabBarIcon: ({ size, color }) => (
              <Plus size={size} color={color} />
            ),
          }}
        />
      ) : null}

      {/* ✅ ALTERAÇÃO: Dashboard visível para Pro e Enterprise */}
      {(isPro || isEnterprise) ? (
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ size, color }) => (
              <Building size={size} color={color} />
            ),
          }}
        />
      ) : null}

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />
      
       <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notificações',
          tabBarIcon: ({ size, color }) => bellIcon(size, color, unreadCount),
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
});