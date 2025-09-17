import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Transfer } from '../../../types/database';
import { useFocusEffect, useRouter } from 'expo-router';
import { Calendar, Users, Truck } from 'lucide-react-native';

type TransferWithDetails = Transfer & {
  transfer_types: {
    title: string;
    origin_description: string;
    destination_description: string;
  }
};

export default function MyTransfersScreen() {
  const { profile } = useAuth();
  const [myTransfers, setMyTransfers] = useState<TransferWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchMyTransfers = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transfers')
        .select(`
          *,
          transfer_types (
            title,
            origin_description,
            destination_description
          )
        `)
        .eq('creator_id', profile.id)
        .order('departure_time', { ascending: false });

      if (error) throw error;
      setMyTransfers(data as TransferWithDetails[] || []);
    } catch (error) {
      console.error('Error fetching my transfers:', error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useFocusEffect(fetchMyTransfers);
  
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      available: '#10b981', full: '#f59e0b', completed: '#6b7280', canceled: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      available: 'Disponível', full: 'Lotado', completed: 'Finalizado', canceled: 'Cancelado'
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchMyTransfers} />}
      >
        {myTransfers.length > 0 ? (
          myTransfers.map((transfer) => (
            <TouchableOpacity
              key={transfer.id}
              style={styles.transferCard}
              onPress={() => router.push(`/(app)/my-transfers/${transfer.id}`)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={2}>{transfer.transfer_types.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transfer.status) }]}>
                  <Text style={styles.statusText}>{getStatusLabel(transfer.status)}</Text>
                </View>
              </View>
              <Text style={styles.cardRoute}>
                {transfer.transfer_types.origin_description} → {transfer.transfer_types.destination_description}
              </Text>
              <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                  <Calendar size={16} color="#64748b" />
                  <Text style={styles.footerText}>{formatDate(transfer.departure_time)}</Text>
                </View>
                <View style={styles.footerItem}>
                  <Users size={16} color="#64748b" />
                  <Text style={styles.footerText}>{transfer.occupied_seats}/{transfer.total_seats} vagas</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Truck size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Nenhum transfer criado</Text>
            <Text style={styles.emptyDescription}>Vá para a aba "Criar" para adicionar sua primeira viagem.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollView: { flex: 1, padding: 24 },
  transferCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b', flex: 1, marginRight: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, color: '#ffffff', fontWeight: 'bold' },
  cardRoute: { fontSize: 14, color: '#64748b', marginBottom: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 14, color: '#475569' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#64748b', marginTop: 16, marginBottom: 8 },
  emptyDescription: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
});