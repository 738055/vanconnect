import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNotifications } from '../../contexts/NotificationContext';
import { Bell } from 'lucide-react-native';

export default function NotificationsScreen() {
  const { notifications, isLoading, markAsRead } = useNotifications();

  const handlePressNotification = (id: string) => {
    markAsRead(id);
    // Aqui você pode adicionar lógica de navegação para a tela relevante (ex: um transfer)
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.notificationCard, !item.read_at && styles.unreadCard]}
      onPress={() => handlePressNotification(item.id)}
    >
      <View style={styles.iconContainer}>
        <Bell size={24} color={!item.read_at ? '#2563eb' : '#64748b'} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, !item.read_at && styles.unreadTitle]}>{item.title}</Text>
        {item.body && <Text style={styles.body}>{item.body}</Text>}
        <Text style={styles.timestamp}>{new Date(item.created_at).toLocaleString('pt-BR')}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Você não tem nenhuma notificação.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#334155',
  },
  unreadTitle: {
    fontWeight: '700',
    color: '#1e293b',
  },
  body: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
});