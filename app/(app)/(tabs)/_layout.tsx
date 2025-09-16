import { Tabs } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { Chrome as Home, Search, Plus, User, Building } from 'lucide-react-native';

export default function TabLayout() {
  const { subscription } = useAuth();
  
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
          borderTopColor: '#e5e7eb',
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
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

      {(isPro || isEnterprise) && (
        <Tabs.Screen
          name="transfers"
          options={{
            title: 'Transfers',
            tabBarIcon: ({ size, color }) => (
              <Search size={size} color={color} />
            ),
          }}
        />
      )}

      {(isPro || isEnterprise) && (
        <Tabs.Screen
          name="create"
          options={{
            title: 'Criar',
            tabBarIcon: ({ size, color }) => (
              <Plus size={size} color={color} />
            ),
          }}
        />
      )}

      {isEnterprise && (
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ size, color }) => (
              <Building size={size} color={color} />
            ),
          }}
        />
      )}

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