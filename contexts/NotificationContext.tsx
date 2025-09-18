import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// Define o formato de uma notificação
type Notification = {
  id: string;
  created_at: string;
  title: string;
  body: string; // Corrigido de 'message' para 'body' para corresponder à tabela
  data: {
    transfer_id?: number;
  } | null;
  read_at: string | null; // Corrigido para corresponder à tabela e ao script
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

// Componente Provedor que envolve a aplicação
export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setNotifications(data || []);
      // Calcula a contagem de não lidas com base em 'read_at'
      const unread = data?.filter(n => n.read_at === null).length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Efeito para buscar as notificações na montagem e quando o usuário muda
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ✅ NOVO: Efeito para escutar mudanças em tempo real
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications_channel')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta INSERT e UPDATE
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          // Quando uma nova notificação é inserida
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new;
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
          // Quando uma notificação é atualizada (ex: lida em outro dispositivo)
          else if (payload.eventType === 'UPDATE') {
            const updatedNotification = payload.new;
            setNotifications(prev => 
              prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            );
            // Recalcula a contagem caso a notificação lida não esteja na tela
            // ou se a atualização mudou o status de 'read_at'
            if (updatedNotification.read_at !== null) {
                setUnreadCount(prev => (prev > 0 ? prev - 1 : 0));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    // Atualiza o estado local primeiro para uma resposta de UI imediata
    setNotifications(prev => 
      prev.map(n => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount(prev => (prev > 0 ? prev - 1 : 0));

    // Em seguida, atualiza o banco de dados em segundo plano
    try {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id);
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      // Opcional: reverter o estado local em caso de erro
      fetchNotifications();
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