import React from 'react';
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
import { Calendar, Users, Check, X, User as UserIcon, ShieldCheck, DollarSign, Flag } from 'lucide-react-native';

type Passenger = {
  id: number;
  full_name: string;
  document_number: string | null;
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
};

export default function ManageTransferScreen() {
  const { id } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const router = useRouter();

  const fetchTransferDetails = async (): Promise<TransferDetails> => {
    const { data, error } = await supabase
      .from('transfers')
      .select(`
        id, departure_time, total_seats, occupied_seats, status,
        transfer_types ( title ),
        transfer_participations (
          id, seats_requested, status, total_price,
          profiles ( full_name, avatar_url ),
          passengers ( id, full_name, document_number )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data as TransferDetails;
  };

  const { data: transfer, isLoading, isError, refetch } = useQuery({
    queryKey: ['transfer-details', id],
    queryFn: fetchTransferDetails,
  });

  const updateParticipationStatus = async ({ participationId, newStatus, seatsRequested }: { participationId: number, newStatus: string, seatsRequested: number }) => {
    const { error } = await supabase.rpc('update_participation_status', {
        participation_id_input: participationId,
        new_status_input: newStatus,
        transfer_id_input: Number(id),
        seats_input: seatsRequested
    });
    if (error) throw new Error(error.message);
  };

  const participationMutation = useMutation({
    mutationFn: updateParticipationStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer-details', id] });
      Alert.alert('Sucesso', 'O status da solicitação foi atualizado.');
    },
    onError: (error) => {
      Alert.alert('Erro', `Não foi possível atualizar o status: ${error.message}`);
    }
  });
  
  const finalizeTransferMutation = useMutation({
    mutationFn: async (transferId: number) => {
      const { error } = await supabase.rpc('finalize_transfer', {
        transfer_id_input: transferId
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer-details', id] });
      Alert.alert('Sucesso', 'O transfer foi marcado como finalizado.');
    },
    onError: (error) => {
      Alert.alert('Erro', `Não foi possível finalizar o transfer: ${error.message}`);
    }
  });

  const handleApprove = (participation: Participant) => {
    participationMutation.mutate({
      participationId: participation.id,
      newStatus: 'approved',
      seatsRequested: participation.seats_requested
    });
  };

  const handleReject = (participation: Participant) => {
    participationMutation.mutate({
      participationId: participation.id,
      newStatus: 'rejected',
      seatsRequested: participation.seats_requested
    });
  };

  const handleConfirmPayment = (participation: Participant) => {
    Alert.alert(
      'Confirmar Pagamento?',
      `Você confirma o recebimento de R$${participation.total_price?.toFixed(2)} de ${participation.profiles?.full_name}? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: () => participationMutation.mutate({
            participationId: participation.id,
            newStatus: 'paid',
            seatsRequested: 0
          })
        },
      ]
    );
  };

  const handleFinalizeTransfer = () => {
    if (!transfer) return;
    Alert.alert(
      'Finalizar Transfer?',
      'Esta ação marcará a viagem como concluída para todos os participantes. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sim, Finalizar', 
          onPress: () => finalizeTransferMutation.mutate(transfer.id)
        },
      ]
    );
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }
  if (isError || !transfer) {
    return (
        <View style={styles.centered}>
            <Text style={styles.errorText}>Não foi possível carregar os detalhes do transfer.</Text>
            <TouchableOpacity onPress={() => refetch()}><Text>Tentar Novamente</Text></TouchableOpacity>
        </View>
    );
  }

  const pendingParticipants = transfer.transfer_participations.filter(p => p.status === 'pending');
  const confirmedParticipants = transfer.transfer_participations.filter(p => p.status === 'approved' || p.status === 'paid');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>{transfer.transfer_types.title}</Text>
          <View style={styles.details}>
            <View style={styles.detailItem}><Calendar size={16} color="#64748b" /><Text style={styles.detailText}>{new Date(transfer.departure_time).toLocaleString('pt-BR')}</Text></View>
            <View style={styles.detailItem}><Users size={16} color="#64748b" /><Text style={styles.detailText}>{transfer.occupied_seats}/{transfer.total_seats} vagas</Text></View>
          </View>
        </View>

        {(transfer.status === 'available' || transfer.status === 'full' || confirmedParticipants.some(p => p.status === 'paid')) && (
          <View style={styles.finalizeSection}>
            <TouchableOpacity 
              style={[styles.finalizeButton, finalizeTransferMutation.isPending && styles.disabledButton]} 
              onPress={handleFinalizeTransfer}
              disabled={finalizeTransferMutation.isPending}
            >
              <Flag size={18} color="#ffffff" />
              <Text style={styles.finalizeButtonText}>
                {finalizeTransferMutation.isPending ? 'Finalizando...' : 'Finalizar Transfer'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Solicitações Pendentes ({pendingParticipants.length})</Text>
          {pendingParticipants.length > 0 ? (
            pendingParticipants.map(p => (
              <View key={p.id} style={styles.participantCard}>
                <View style={styles.participantInfo}>
                  <View style={styles.avatarPlaceholder}><UserIcon size={24} color="#64748b" /></View>
                  <View>
                    <Text style={styles.participantName}>{p.profiles?.full_name || 'Usuário'}</Text>
                    <Text style={styles.participantSeats}>{p.seats_requested} vaga{p.seats_requested > 1 ? 's' : ''} solicitada{p.seats_requested > 1 ? 's' : ''}</Text>
                  </View>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => handleReject(p)}>
                    <X size={20} color="#ef4444" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={() => handleApprove(p)}>
                    <Check size={20} color="#10b981" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Nenhuma solicitação pendente no momento.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participantes Confirmados ({confirmedParticipants.length})</Text>
          {confirmedParticipants.length > 0 ? (
            confirmedParticipants.map(p => (
              <View key={p.id} style={[styles.participantCard, p.status === 'paid' ? styles.paidCard : styles.confirmedCard]}>
                <View style={styles.participantHeader}>
                    <View style={styles.participantInfo}>
                        <View style={styles.avatarPlaceholder}><UserIcon size={24} color="#64748b" /></View>
                        <View>
                            <Text style={styles.participantName}>{p.profiles?.full_name || 'Usuário'}</Text>
                            <Text style={styles.participantSeats}>{p.seats_requested} vaga{p.seats_requested > 1 ? 's' : ''} confirmada{p.seats_requested > 1 ? 's' : ''}</Text>
                        </View>
                    </View>
                    <Text style={[styles.statusTextConfirmed, p.status === 'paid' && {color: '#2563eb'}]}>
                      {p.status === 'paid' ? 'PAGO' : 'APROVADO'}
                    </Text>
                </View>
                
                {p.passengers && p.passengers.length > 0 && (
                  <View style={styles.passengerList}>
                    <Text style={styles.passengerListTitle}>Passageiros Informados:</Text>
                    {p.passengers.map(passenger => (
                      <View key={passenger.id} style={styles.passengerItem}>
                        <UserIcon size={16} color="#475569" />
                        <View>
                          <Text style={styles.passengerName}>{passenger.full_name}</Text>
                          {passenger.document_number && <Text style={styles.passengerDoc}>Doc: {passenger.document_number}</Text>}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {p.status === 'approved' && (
                  <TouchableOpacity 
                    style={[styles.confirmPaymentButton, participationMutation.isPending && styles.disabledButton]} 
                    onPress={() => handleConfirmPayment(p)}
                    disabled={participationMutation.isPending}
                  >
                    <DollarSign size={16} color="#ffffff" />
                    <Text style={styles.confirmPaymentButtonText}>Confirmar Pagamento</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Nenhum participante confirmado ainda.</Text>
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
  finalizeSection: {
    paddingHorizontal: 24,
    paddingBottom: 0,
    paddingTop: 24,
  },
  finalizeButton: {
    backgroundColor: '#4f46e5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },
  finalizeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: { padding: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  participantCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  confirmedCard: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  paidCard: { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' },
  participantHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  participantInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  participantName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  participantSeats: { fontSize: 14, color: '#64748b' },
  actions: { flexDirection: 'row', gap: 12 },
  actionButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  rejectButton: { backgroundColor: '#fee2e2' },
  approveButton: { backgroundColor: '#dcfce7' },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  statusTextConfirmed: { fontSize: 12, fontWeight: 'bold', color: '#15803d' },
  passengerList: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  passengerListTitle: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 12 },
  passengerItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  passengerName: { fontSize: 14, color: '#334155' },
  passengerDoc: { fontSize: 12, color: '#64748b' },
  confirmPaymentButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    marginTop: 16,
  },
  confirmPaymentButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  disabledButton: { opacity: 0.6 },
});