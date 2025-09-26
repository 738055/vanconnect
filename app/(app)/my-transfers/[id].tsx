import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Users, Check, X, User as UserIcon, Flag, Home, Plane } from 'lucide-react-native';
import { useAuth } from '../../../contexts/AuthContext';

// ✅ TIPO ATUALIZADO para incluir os novos dados do passageiro
type Passenger = {
  id: number;
  full_name: string;
  document_number: string | null;
  hotel_address: string | null;
  flight_info: string | null;
};

type Participant = {
  id: number;
  seats_requested: number;
  status: string;
  total_price: number;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  } | null;
  passengers: Passenger[];
};

type TransferDetails = {
  id: number;
  departure_time: string;
  total_seats: number;
  occupied_seats: number;
  status: string;
  transfer_types: {
    title: string;
  };
  transfer_participations: Participant[];
  creator_id: string;
};

export default function ManageTransferScreen() {
  const { id } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { profile } = useAuth();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchTransferDetails = async (): Promise<TransferDetails> => {
    if (!id || !profile?.id) {
      throw new Error("ID do transfer ou perfil do utilizador não encontrado.");
    }
    
    const { data, error } = await supabase
      .from('transfers')
      .select(`
        id, departure_time, total_seats, occupied_seats, status, creator_id,
        transfer_types ( title ),
        transfer_participations (
          id, seats_requested, status, total_price,
          profiles ( full_name, avatar_url ),
          passengers ( id, full_name, document_number, hotel_address, flight_info )
        )
      `)
      .eq('id', id)
      .eq('creator_id', profile.id)
      .single();

    if (error) throw new Error(error.message);
    return data as TransferDetails;
  };

  const { data: transfer, isLoading, isError, refetch } = useQuery({
    queryKey: ['manage-transfer-details', id],
    queryFn: fetchTransferDetails,
    enabled: !!id && !!profile?.id,
  });

  // ... (As suas mutações 'updateParticipationStatus' e 'finalizeTransferMutation' permanecem iguais)
  const updateParticipationStatus = async ({ participationId, newStatus, seatsRequested }: { participationId: number, newStatus: string, seatsRequested: number }) => {
    const { error } = await supabase.rpc('update_participation_status', {
        p_participation_id: participationId,
        p_new_status: newStatus,
        p_transfer_id: Number(id),
        p_seats_to_adjust: seatsRequested
    });
    if (error) throw new Error(error.message);
  };

  const participationMutation = useMutation({
    mutationFn: updateParticipationStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manage-transfer-details', id] });
      Alert.alert('Sucesso', 'O status da solicitação foi atualizado.');
    },
    onError: (error) => {
      Alert.alert('Erro', `Não foi possível atualizar o status: ${error.message}`);
    }
  });

  const finalizeTransferMutation = useMutation({
    mutationFn: async (transferId: number) => {
      const { error } = await supabase.rpc('finalize_transfer', { p_transfer_id: transferId });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-transfers'] });
      Alert.alert('Sucesso', 'O transfer foi marcado como finalizado.');
      router.back();
    },
    onError: (error) => {
      Alert.alert('Erro', `Não foi possível finalizar o transfer: ${error.message}`);
    }
  });

  const handleApprove = (p: Participant) => participationMutation.mutate({ participationId: p.id, newStatus: 'approved', seatsRequested: p.seats_requested });
  const handleReject = (p: Participant) => participationMutation.mutate({ participationId: p.id, newStatus: 'rejected', seatsRequested: p.seats_requested });
  const handleFinalizeTransfer = () => { /* ... (código igual) ... */ };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }
  if (isError || !transfer) {
    return (
        <View style={styles.centered}>
            <Text style={styles.errorText}>Não foi possível carregar os detalhes.</Text>
            <TouchableOpacity onPress={() => refetch()}><Text>Tentar Novamente</Text></TouchableOpacity>
        </View>
    );
  }

  const pendingParticipants = transfer.transfer_participations.filter(p => p.status === 'pending');
  // ✅ ATUALIZAÇÃO: Filtrar por 'paid' para participantes confirmados
  const confirmedParticipants = transfer.transfer_participations.filter(p => p.status === 'paid');

  const departureTime = new Date(transfer.departure_time + 'Z');
  const canFinalize = currentTime > departureTime;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* ... (O seu cabeçalho e seção de finalizar permanecem iguais) ... */}
        <View style={styles.header}>
          <Text style={styles.title}>{transfer.transfer_types.title}</Text>
          <View style={styles.details}>
            <View style={styles.detailItem}><Calendar size={16} color="#64748b" /><Text style={styles.detailText}>{new Date(transfer.departure_time).toLocaleString('pt-BR')}</Text></View>
            <View style={styles.detailItem}><Users size={16} color="#64748b" /><Text style={styles.detailText}>{transfer.occupied_seats}/{transfer.total_seats} vagas</Text></View>
          </View>
        </View>

        {(transfer.status === 'available' || transfer.status === 'full') && (
          <View style={styles.finalizeSection}>
            <TouchableOpacity 
              style={[styles.finalizeButton, !canFinalize && styles.disabledButton]} 
              onPress={handleFinalizeTransfer}
              disabled={!canFinalize || finalizeTransferMutation.isPending}
            >
              <Flag size={18} color="#ffffff" />
              <Text style={styles.finalizeButtonText}>
                {finalizeTransferMutation.isPending ? 'Finalizando...' : 'Finalizar Transfer'}
              </Text>
            </TouchableOpacity>
            {!canFinalize && <Text style={styles.finalizeHint}>O botão será liberado no horário da partida.</Text>}
          </View>
        )}
        
        {/* ... (A sua seção de solicitações pendentes permanece igual) ... */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Solicitações Pendentes ({pendingParticipants.length})</Text>
          {/* ... (map de pendingParticipants) ... */}
        </View>

        {/* ✅ SEÇÃO ATUALIZADA: Participantes Confirmados com novos dados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participantes Confirmados ({confirmedParticipants.length})</Text>
          {confirmedParticipants.length > 0 ? (
            confirmedParticipants.map(p => (
              <View key={p.id} style={styles.confirmedCard}>
                <View style={styles.participantHeader}>
                    <View style={styles.participantInfo}>
                        <View style={styles.avatarPlaceholder}><UserIcon size={24} color="#64748b" /></View>
                        <View>
                            <Text style={styles.participantName}>{p.profiles?.full_name || 'Usuário'}</Text>
                            <Text style={styles.participantSeats}>{p.seats_requested} vaga{p.seats_requested > 1 ? 's' : ''} confirmada{p.seats_requested > 1 ? 's' : ''}</Text>
                        </View>
                    </View>
                </View>
                {p.passengers && p.passengers.length > 0 && (
                  <View style={styles.passengerList}>
                    <Text style={styles.passengerListTitle}>Passageiros:</Text>
                    {p.passengers.map(passenger => (
                      <View key={passenger.id} style={styles.passengerItemContainer}>
                        <View style={styles.passengerItem}>
                          <UserIcon size={16} color="#475569" />
                          <Text style={styles.passengerName}>{passenger.full_name}</Text>
                        </View>
                        {passenger.hotel_address && (
                          <View style={styles.passengerItem}>
                            <Home size={16} color="#475569" />
                            <Text style={styles.passengerDetailText}>{passenger.hotel_address}</Text>
                          </View>
                        )}
                        {passenger.flight_info && (
                          <View style={styles.passengerItem}>
                            <Plane size={16} color="#475569" />
                            <Text style={styles.passengerDetailText}>{passenger.flight_info}</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Nenhum participante confirmado.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 16, color: '#ef4444', textAlign: 'center', marginBottom: 16 },
  scrollView: { flex: 1 },
  header: { backgroundColor: '#ffffff', padding: 24, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  details: { flexDirection: 'row', gap: 24 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 14, color: '#475569' },
  finalizeSection: { padding: 24, alignItems: 'center' },
  finalizeButton: { backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 10, width: '100%' },
  finalizeButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  finalizeHint: { fontSize: 12, color: '#64748b', marginTop: 8 },
  disabledButton: { backgroundColor: '#9ca3af' },
  section: { paddingHorizontal: 24, paddingTop: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  participantCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  confirmedCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  participantInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  participantName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  participantSeats: { fontSize: 14, color: '#64748b' },
  actions: { flexDirection: 'row', gap: 12 },
  actionButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  rejectButton: { backgroundColor: '#fee2e2' },
  approveButton: { backgroundColor: '#dcfce7' },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center', paddingVertical: 16 },
  participantHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  passengerList: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  passengerListTitle: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 12 },
  passengerItemContainer: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 8, gap: 8 },
  passengerItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  passengerName: { fontSize: 14, color: '#334155', fontWeight: '500' },
  passengerDetailText: { fontSize: 14, color: '#475569' },
});