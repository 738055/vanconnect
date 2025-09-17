import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import { UserCheck, Clock, XCircle, CheckCircle2 } from 'lucide-react-native';

// Tipo de dado que esperamos do Supabase
type Participation = {
  id: number;
  status: string;
  seats_requested: number;
  transfers: {
    id: number;
    departure_time: string;
    transfer_types: {
      title: string;
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
          id,
          status,
          seats_requested,
          transfers (
            id,
            departure_time,
            transfer_types ( title )
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

  useFocusEffect(fetchMyParticipations);

  const StatusInfo = ({ status }: { status: string }) => {
    const statusConfig: { [key: string]: { icon: React.ReactNode, text: string, color: string } } = {
      pending: { icon: <Clock size={16} color="#f59e0b" />, text: 'Pendente', color: '#f59e0b' },
      approved: { icon: <CheckCircle2 size={16} color="#10b981" />, text: 'Aprovado', color: '#10b981' },
      rejected: { icon: <XCircle size={16} color="#ef4444" />, text: 'Rejeitado', color: '#ef4444' },
      paid: { icon: <CheckCircle2 size={16} color="#2563eb" />, text: 'Pago', color: '#2563eb' },
    };
    const config = statusConfig[status] || { icon: null, text: status, color: '#64748b' };
    return (
      <View style={[styles.statusBadge, { backgroundColor: `${config.color}15` }]}>
        {config.icon}
        <Text style={[styles.statusText, { color: config.color }]}>{config.text}</Text>
      </View>
    );
  };

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
                <Text>Data: {new Date(p.transfers?.departure_time || '').toLocaleDateString('pt-BR')}</Text>
                <Text>Vagas Solicitadas: {p.seats_requested}</Text>
              </View>
              {/* Botão de Ação aparece se a solicitação foi aprovada */}
              {p.status === 'approved' && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => router.push(`/(app)/participations/${p.id}/add-passengers`)}
                >
                  <UserCheck size={16} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Informar Passageiros</Text>
                </TouchableOpacity>
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
    marginBottom: 16,
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
  actionButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#ffffff',
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