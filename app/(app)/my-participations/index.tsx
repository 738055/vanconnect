import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Linking, Alert } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import { Clock, CheckCircle2, User as UserIcon, Home, Plane, ChevronDown, ChevronUp } from 'lucide-react-native';

// ✅ TIPO ATUALIZADO
type Passenger = {
  full_name: string;
  hotel_address: string | null;
  flight_info: string | null;
};

type Participation = {
  id: number;
  status: string;
  seats_requested: number;
  total_price: number | null;
  passengers: Passenger[];
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
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);
  const router = useRouter();

  const fetchMyParticipations = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      // ✅ QUERY ATUALIZADA para buscar os passageiros
      const { data, error } = await supabase
        .from('transfer_participations')
        .select(`
          id, status, seats_requested, total_price,
          passengers ( full_name, hotel_address, flight_info ),
          transfers (
            id, departure_time,
            transfer_types ( title ),
            profiles!transfers_creator_id_fkey ( phone )
          )
        `)
        .eq('participant_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setParticipations(data as Participation[] || []);
    } catch (error) {
      console.error('Error fetching my participations:', error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      fetchMyParticipations();
    }, [fetchMyParticipations])
  );
  
  const handleToggleExpand = (id: number) => {
    setExpandedCardId(expandedCardId === id ? null : id);
  };
  
  // Componente de Status permanece o mesmo...
  const StatusInfo = ({ status }: { status: string }) => { /* ... */ };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
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
                <Text style={styles.cardText}>Vagas Reservadas: {p.seats_requested}</Text>
                <Text style={styles.cardPrice}>Valor Total: R$ {(p.total_price || 0).toFixed(2)}</Text>
              </View>

              {/* ✅ NOVO: Seção Expansível para Detalhes dos Passageiros */}
              {p.status === 'paid' && (
                <View style={styles.detailsSection}>
                  <TouchableOpacity style={styles.detailsButton} onPress={() => handleToggleExpand(p.id)}>
                    <Text style={styles.detailsButtonText}>Ver Detalhes</Text>
                    {expandedCardId === p.id ? <ChevronUp size={16} color="#2563eb" /> : <ChevronDown size={16} color="#2563eb" />}
                  </TouchableOpacity>
                  
                  {expandedCardId === p.id && (
                    <View style={styles.passengerList}>
                      {p.passengers.map((passenger, index) => (
                        <View key={index} style={styles.passengerItem}>
                          <View style={styles.passengerDetail}><UserIcon size={16} color="#475569"/><Text style={styles.passengerText}>{passenger.full_name}</Text></View>
                          <View style={styles.passengerDetail}><Home size={16} color="#475569"/><Text style={styles.passengerText}>{passenger.hotel_address}</Text></View>
                          <View style={styles.passengerDetail}><Plane size={16} color="#475569"/><Text style={styles.passengerText}>{passenger.flight_info}</Text></View>
                        </View>
                      ))}
                    </View>
                  )}
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
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b', flex: 1, marginRight: 12 },
  cardBody: { gap: 8, marginBottom: 8 },
  cardText: { fontSize: 14, color: '#475569' },
  cardPrice: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginTop: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  detailsSection: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
  detailsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  detailsButtonText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
  passengerList: { marginTop: 16, gap: 12 },
  passengerItem: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, gap: 8 },
  passengerDetail: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  passengerText: { fontSize: 14, color: '#334155' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#64748b', marginTop: 16, marginBottom: 8 },
  emptyDescription: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
});