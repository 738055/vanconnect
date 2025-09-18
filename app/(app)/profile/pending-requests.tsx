import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect } from 'expo-router';
import { User, CheckCircle, XCircle } from 'lucide-react-native';

type PendingRequest = {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  full_name: string;
  transfer_id: number;
  transfer_title: string;
  seats_requested: number;
  created_at: string;
};

export default function PendingRequestsScreen() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPendingRequests = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      // 1. Fetch transfers created by the user
      const { data: myTransfers, error: transfersError } = await supabase
        .from('transfers')
        .select('id, transfer_types(title)');
      
      if (transfersError) throw transfersError;
      
      const myTransferIds = myTransfers.map(t => t.id);

      if (myTransferIds.length === 0) {
        setRequests([]);
        return;
      }

      // 2. Fetch pending participations for these transfers
      const { data, error } = await supabase
        .from('transfer_participations')
        .select(`
          id,
          status,
          seats_requested,
          created_at,
          profiles(full_name),
          transfers(transfer_types(title))
        `)
        .in('transfer_id', myTransferIds)
        .eq('status', 'pending');

      if (error) throw error;
      
      const formattedRequests = data.map(item => ({
        id: item.id,
        status: item.status,
        seats_requested: item.seats_requested,
        transfer_id: item.transfers.id,
        transfer_title: item.transfers.transfer_types.title,
        full_name: item.profiles.full_name,
        created_at: item.created_at,
      }));
      setRequests(formattedRequests);

    } catch (error) {
      console.error('Error fetching pending requests:', error);
      Alert.alert('Erro', 'Não foi possível carregar as solicitações pendentes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      fetchPendingRequests();
    }, [fetchPendingRequests])
  );

  const handleUpdateStatus = async (id: number, newStatus: 'approved' | 'rejected') => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('transfer_participations')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      Alert.alert('Sucesso', `Solicitação ${newStatus === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso!`);
      fetchPendingRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Erro', `Não foi possível ${newStatus === 'approved' ? 'aprovar' : 'rejeitar'} a solicitação.`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchPendingRequests} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Solicitações Pendentes</Text>
        </View>

        {requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma solicitação pendente encontrada.</Text>
          </View>
        ) : (
          requests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.cardHeader}>
                <View style={styles.userIconContainer}>
                  <User size={24} color="#334155" />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{request.full_name}</Text>
                  <Text style={styles.cardSubtitle}>{request.seats_requested} assento(s) para o transfer: {request.transfer_title}</Text>
                </View>
              </View>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => handleUpdateStatus(request.id, 'approved')}
                >
                  <CheckCircle size={20} color="#ffffff" />
                  <Text style={styles.buttonText}>Aprovar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => handleUpdateStatus(request.id, 'rejected')}
                >
                  <XCircle size={20} color="#ffffff" />
                  <Text style={styles.buttonText}>Rejeitar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { padding: 24, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { padding: 24, alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 16, color: '#64748b' },
  requestCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  userIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b' },
  cardSubtitle: { fontSize: 14, color: '#64748b' },
  buttonContainer: { flexDirection: 'row', gap: 12 },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});