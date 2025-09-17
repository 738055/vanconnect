import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Linking, Alert } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import { UserCheck, Clock, XCircle, CheckCircle2, MessageSquare } from 'lucide-react-native';

type Participation = {
  id: number;
  status: string;
  seats_requested: number;
  total_price: number | null;
  transfers: {
    id: number;
    departure_time: string;
    transfer_types: {
      title: string;
    } | null;
    profiles: {
      phone: string | null;
    } | null;
  } | null;
};

export default function MyParticipationsScreen() {
  const { profile } = useAuth();
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchMyParticipations = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transfer_participations')
        .select(`
          id, status, seats_requested, total_price,
          transfers (
            id, departure_time,
            transfer_types ( title ),
            profiles!transfers_creator_id_fkey ( phone )
          )
        `)
        .eq('participant_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setParticipations(data || []);
    } catch (error) {
      console.error('Error fetching my participations:', error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  // ✅ CORREÇÃO APLICADA AQUI
  useFocusEffect(
    useCallback(() => {
      fetchMyParticipations();
    }, [fetchMyParticipations])
  );

  const handlePayViaWhatsApp = async (participation: Participation) => { /* ... (código não muda) ... */ };
  const StatusInfo = ({ status }: { status: string }) => { /* ... (código não muda) ... */ };

  if (loading) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" /></View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchMyParticipations} />}
      >
        {participations.length > 0 ? (
          participations.map((p) => (
            <View key={p.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={2}>{p.transfers?.transfer_types?.title || 'Transfer Deletado'}</Text>
                <StatusInfo status={p.status} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardText}>Data: {new Date(p.transfers?.departure_time || '').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                <Text style={styles.cardText}>Vagas Solicitadas: {p.seats_requested}</Text>
                <Text style={styles.cardPrice}>Valor Total: R$ {(p.total_price || 0).toFixed(2)}</Text>
              </View>
              {p.status === 'approved' && (
                <View style={styles.actionsContainer}>
                  <TouchableOpacity 
                    style={styles.secondaryActionButton}
                    onPress={() => router.push(`/(app)/participations/${p.id}/add-passengers`)}
                  >
                    <UserCheck size={16} color="#4f46e5" />
                    <Text style={styles.secondaryActionButtonText}>Informar Passageiros</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.primaryActionButton}
                    onPress={() => handlePayViaWhatsApp(p)}
                  >
                    <MessageSquare size={16} color="#ffffff" />
                    <Text style={styles.primaryActionButtonText}>Pagar via WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nenhuma participação</Text>
            <Text style={styles.emptyDescription}>Vá para a Vitrine e participe de um transfer!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1, padding: 24 },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 12,
  },
  cardBody: {
    gap: 8,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#475569',
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryActionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: '#eef2ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  secondaryActionButtonText: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});