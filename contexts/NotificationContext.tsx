import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

// Definição dos tipos
type Notification = {
    id: string;
    created_at: string;
    title: string;
    body: string | null;
    read_at: string | null;
};

type NotificationContextType = {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    markAsRead: (id: string) => void;
};

// Criar o Contexto
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Hook para usar o Contexto
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications deve ser usado dentro de um NotificationProvider');
    }
    return context;
};

// Componente Provider
export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { profile } = useAuth();
    const queryClient = useQueryClient();

    // Consulta para buscar todas as notificações do usuário
    const fetchNotifications = async (): Promise<Notification[]> => {
        if (!profile) return [];
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return data;
    };

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: fetchNotifications,
        enabled: !!profile,
    });

    // Mutação para marcar uma notificação como lida
    const markAsReadMutation = useMutation({
        mutationFn: async (id: string) => {
            await supabase
                .from('notifications')
                .update({ read_at: new Date().toISOString() })
                .eq('id', id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const markAsRead = (id: string) => {
        markAsReadMutation.mutate(id);
    };

    // Subscrição em tempo real para novas notificações
    useEffect(() => {
        if (!profile) return;
        const channel = supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${profile.id}`,
                },
                (payload) => {
                    queryClient.invalidateQueries({ queryKey: ['notifications'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile, queryClient]);

    const unreadCount = notifications.filter((n) => !n.read_at).length;

    const value = {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};