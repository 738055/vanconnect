import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
// Importe o hook customizado do seu contexto
import { useNotifications } from '../../../contexts/NotificationContext';
import { Bell, Inbox } from 'lucide-react-native';

// Mantenha o tipo de notificação como estava, mas ele será fornecido pelo contexto
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

export default function NotificationsScreen() {
  const router = useRouter();
  // ✅ Agora use o hook do contexto para obter os dados e funções
  const { notifications, isLoading, refetch, markAsRead } = useNotifications();

  // A função para buscar e os estados locais não são mais necessários
  // pois o contexto já gerencia isso para você.
  // const [notifications, setNotifications] = useState<Notification[]>([]);
  // const [loading, setLoading] = useState(true);
  // const fetchNotifications = useCallback(...);
  // useFocusEffect(...);

  const handleNotificationPress = async (notification: Notification) => {
    // 1. Marca a notificação como lida usando a função do contexto
    if (!notification.read_at) {
      await markAsRead(notification.id);
    }
    
    // 2. Navega para o transfer, se houver um ID nos dados da notificação
    if (notification.data?.transfer_id) {
      router.push(`/(app)/transfer-details/${notification.data.transfer_id}`);
    }
  };

  // Função para formatar o tempo decorrido - Mantida como está
  const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `há ${Math.floor(interval)} anos`;
    interval = seconds / 2592000;
    if (interval > 1) return `há ${Math.floor(interval)} meses`;
    interval = seconds / 86400;
    if (interval > 1) return `há ${Math.floor(interval)} dias`;
    interval = seconds / 3600;
    if (interval > 1) return `há ${Math.floor(interval)} horas`;
    interval = seconds / 60;
    if (interval > 1) return `há ${Math.floor(interval)} minutos`;
    return `há ${Math.floor(seconds)} segundos`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notificações</Text>
      </View>
      {/* ✅ Use isLoading do contexto */}
      {isLoading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#2563eb" /></View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          // ✅ Use isLoading e refetch do contexto
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        >
          {notifications.length > 0 ? (
            notifications.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.notificationCard, !item.read_at && styles.unreadCard]}
                onPress={() => handleNotificationPress(item)}
              >
                {!item.read_at && <View style={styles.unreadDot} />}
                <View style={[styles.iconContainer, !item.read_at && styles.unreadIconContainer]}>
                  <Bell size={24} color={!item.read_at ? '#2563eb' : '#64748b'} />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{item.title}</Text>
                  <Text style={styles.notificationBody}>{item.body}</Text>
                  <Text style={styles.notificationTime}>{timeSince(item.created_at)}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Inbox size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
              <Text style={styles.emptyDescription}>Suas novas notificações aparecerão aqui.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ✅ Mantenha os estilos exatamente como estão
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 24, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  notificationCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  unreadCard: {
    backgroundColor: '#eff6ff',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadIconContainer: {
    backgroundColor: '#dbeafe',
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
    zIndex: 1,
  },
  notificationContent: { flex: 1, gap: 4 },
  notificationTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  notificationBody: { fontSize: 14, color: '#475569', lineHeight: 20 },
  notificationTime: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#64748b', marginTop: 16, marginBottom: 8 },
  emptyDescription: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
});