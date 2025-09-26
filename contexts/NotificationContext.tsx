import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Define o formato de uma notificação
type Notification = {
  id: string;
  created_at: string;
  title: string;
  body: string;
  data: {
    transfer_id?: number;
  } | null;
  read_at: string | null;
};

// Define o que o contexto irá fornecer
type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  refetch: () => void;
  markAsRead: (id: string) => Promise<void>;
};

// Cria o contexto com um valor padrão
const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  isLoading: true,
  refetch: () => {},
  markAsRead: async () => {},
});

// Hook customizado para usar o contexto facilmente
export const useNotifications = () => useContext(NotificationContext);

// Configuração inicial para as notificações (o que acontece quando a notificação chega)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Componente Provedor que envolve a aplicação
export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pushToken, setPushToken] = useState<string | null>(null);

  // Função para registar o dispositivo para notificações push
  const registerForPushNotificationsAsync = async () => {
    let token;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Falha ao obter o token para notificações push!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  };

  // Efeito para obter e guardar o push token
  useEffect(() => {
    if (user && profile) {
      registerForPushNotificationsAsync().then(async (token) => {
        if (token && token !== profile.push_token) {
          // Salva o novo token no perfil do utilizador
          await supabase
            .from('profiles')
            .update({ push_token: token })
            .eq('id', user.id);
          setPushToken(token);
        }
      });
    }
  }, [user, profile]);


  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setNotifications(data);
        const unread = data.filter(n => !n.read_at).length;
        setUnreadCount(unread);
      }
    } catch (error: any) {
      console.error('Erro ao buscar notificações:', error.message);
    } finally {
      setIsLoading(false); // Garante que o loading sempre termine
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Efeito para escutar mudanças em tempo real (Realtime)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload: any) => {
            // Refetch notifications on any change
            fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const markAsRead = async (id: string) => {
    const notification = notifications.find(n => n.id === id);
    // Só atualiza se a notificação existir e não tiver sido lida
    if (notification && !notification.read_at) {
        setNotifications(prev =>
            prev.map(n =>
                n.id === id ? { ...n, read_at: new Date().toISOString() } : n
            )
        );
        setUnreadCount(prev => (prev > 0 ? prev - 1 : 0));

        // Atualiza no Supabase em segundo plano
        await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', id);
    }
  };

  const value = {
    notifications,
    unreadCount,
    isLoading,
    refetch: fetchNotifications,
    markAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};