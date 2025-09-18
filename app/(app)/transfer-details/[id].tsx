import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { Car, MapPin, Clock, Users, MessageSquare, DollarSign, X, CheckCircle } from 'lucide-react-native';
import { useAuth } from '../../../contexts/AuthContext';

type TransferDetails = {
  id: number;
  creator_id: string;
  departure_time: string;
  total_seats: number;
  occupied_seats: number;
  price_per_seat: number;
  observations: string | null;
  status: string;
  transfer_types: {
    title: string;
    origin_description: string;
    destination_description: string;
  };
  profiles: {
    full_name: string;
    phone: string | null;
  };
  vehicles: {
    model: string;
    plate: string;
  }
};

export default function TransferDetailsScreen() {
  const { id: transferId } = useLocalSearchParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [transfer, setTransfer] = useState<TransferDetails | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isBookingModalVisible, setBookingModalVisible] = useState(false);
  const [seatsToBook, setSeatsToBook] = useState('1');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchTransferDetails = async () => {
    if (!transferId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transfers')
        .select(`*, creator_id, transfer_types(*), profiles:creator_id(*), vehicles(*)`)
        .eq('id', transferId)
        .single();
      if (error) throw error;
      setTransfer(data as any);
    } catch (error: any) {
      console.error('Error fetching transfer details:', error);
      Alert.alert('Erro', `Não foi possível carregar os detalhes do transfer: ${error.message}`);
      setTransfer(null);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchTransferDetails();
  }, [transferId]));

  const getAvailableSeats = () => (transfer?.total_seats || 0) - (transfer?.occupied_seats || 0);

  const handleBookNow = () => {
    const requestedSeats = parseInt(seatsToBook);
    const availableSeats = getAvailableSeats();
    if (isNaN(requestedSeats) || requestedSeats <= 0) {
      Alert.alert('Erro', 'Por favor, insira um número de vagas válido.');
      return;
    }
    if (requestedSeats > availableSeats) {
      Alert.alert('Atenção', `Este transfer só tem ${availableSeats} vagas disponíveis.`);
      return;
    }
    router.push({
      pathname: '/(app)/booking/add-passengers', 
      params: {
        transferId: transfer?.id,
        seatsRequested: requestedSeats,
        totalPrice: (requestedSeats * (transfer?.price_per_seat || 0)).toFixed(2),
      }
    });
    setBookingModalVisible(false);
  };

  const handleFinalizeTransfer = async () => {
    Alert.alert(
      "Confirmar Finalização",
      "Você tem certeza que deseja marcar este transfer como concluído? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim, Finalizar",
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from('transfers')
                .update({ status: 'completed' })
                .eq('id', transferId);
              if (error) throw error;
              Alert.alert('Sucesso!', 'O transfer foi marcado como concluído.');
              router.back();
            } catch (error: any) {
              Alert.alert('Erro', `Não foi possível finalizar o transfer: ${error.message}`);
            } finally {
              setLoading(false);
            }
          },
          style: "destructive"
        }
      ]
    );
  };
  
  if (loading) {
    return (<View style={styles.centered}><ActivityIndicator size="large" color="#2563eb" /></View>);
  }

  if (!transfer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
            <Text style={styles.emptyText}>Transfer não encontrado.</Text>
            <TouchableOpacity onPress={() => router.back()} style={{marginTop: 16}}>
                <Text style={{color: '#2563eb'}}>Voltar</Text>
            </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ LÓGICA ATUALIZADA
  const departureTime = new Date(transfer.departure_time + 'Z');
  // O botão agora é habilitado imediatamente após o horário de partida
  const canFinalize = currentTime > departureTime;

  return (
    <SafeAreaView style={styles.container}>
      <Modal animationType="slide" transparent={true} visible={isBookingModalVisible} onRequestClose={() => setBookingModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reservar Vagas</Text>
              <TouchableOpacity onPress={() => setBookingModalVisible(false)}><X size={24} color="#64748b" /></TouchableOpacity>
            </View>
            <Text style={styles.modalInfo}>Vagas disponíveis: {getAvailableSeats()}</Text>
            <Text style={styles.modalInfo}>Preço por vaga: R$ {transfer.price_per_seat?.toFixed(2) || '0.00'}</Text>
            <Text style={styles.label}>Quantas vagas você deseja?</Text>
            <TextInput style={styles.modalInput} keyboardType="numeric" value={seatsToBook} onChangeText={setSeatsToBook} placeholder="1" />
            <TouchableOpacity style={styles.modalButton} onPress={handleBookNow}>
              <Text style={styles.modalButtonText}>Adicionar Passageiros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTransferDetails} />}>
        <View style={styles.header}>
            <Text style={styles.transferTitle}>{transfer.transfer_types.title}</Text>
            <Text style={styles.transferRoute}><MapPin size={16} color="#64748b" /> {transfer.transfer_types.origin_description} → {transfer.transfer_types.destination_description}</Text>
        </View>
        <View style={styles.content}>
            <View style={styles.profileCard}>
                <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>{transfer.profiles?.full_name?.charAt(0) || 'U'}</Text></View>
                <View style={styles.profileDetails}>
                    <Text style={styles.profileName}>{transfer.profiles?.full_name || 'Usuário'}</Text>
                    {transfer.vehicles && (<View style={styles.vehicleInfo}><Car size={16} color="#475569" /><Text style={styles.vehicleText}>{transfer.vehicles.model} ({transfer.vehicles.plate})</Text></View>)}
                </View>
            </View>
            <View style={styles.detailsCard}>
                <View style={styles.detailItem}><Clock size={20} color="#2563eb" /><View><Text style={styles.detailLabel}>Partida</Text><Text style={styles.detailText}>{new Date(transfer.departure_time).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</Text></View></View>
                <View style={styles.separator} />
                <View style={styles.detailItem}><Users size={20} color="#2563eb" /><View><Text style={styles.detailLabel}>Vagas</Text><Text style={styles.detailText}>{getAvailableSeats()} de {transfer.total_seats} disponíveis</Text></View></View>
                <View style={styles.separator} />
                <View style={styles.detailItem}><DollarSign size={20} color="#2563eb" /><View><Text style={styles.detailLabel}>Preço</Text><Text style={styles.detailText}>R$ {transfer.price_per_seat?.toFixed(2) || '0.00'} por vaga</Text></View></View>
            </View>
            {transfer.observations && (<View style={styles.obsCard}><View style={styles.obsHeader}><MessageSquare size={20} color="#2563eb" /><Text style={styles.obsTitle}>Observações</Text></View><Text style={styles.obsText}>{transfer.observations}</Text></View>)}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {profile?.id === transfer.creator_id ? (
          <TouchableOpacity
            style={[styles.finalizeButton, (!canFinalize || transfer.status === 'completed') && styles.disabledButton]}
            onPress={handleFinalizeTransfer}
            disabled={!canFinalize || transfer.status === 'completed'}
          >
            <CheckCircle size={20} color="#ffffff" />
            <Text style={styles.participateButtonText}>
              {transfer.status === 'completed' ? 'Transfer Finalizado' : 'Finalizar Transfer'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.participateButton, transfer.status !== 'available' && styles.disabledButton]}
            onPress={() => setBookingModalVisible(true)}
            disabled={transfer.status !== 'available'}
          >
            <Text style={styles.participateButtonText}>{transfer.status === 'full' ? 'Lotado' : 'Reservar Vagas'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollView: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 16, color: '#64748b' },
  header: { backgroundColor: '#ffffff', padding: 24, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, },
  transferTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  transferRoute: { fontSize: 16, color: '#64748b' },
  content: { padding: 24, gap: 16 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, },
  avatarPlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#ffffff' },
  profileDetails: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '600', color: '#1e293b' },
  vehicleInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, marginTop: 8 },
  vehicleText: { fontSize: 16, color: '#475569' },
  detailsCard: { backgroundColor: '#ffffff', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  detailLabel: { fontSize: 12, color: '#94a3b8' },
  detailText: { fontSize: 16, fontWeight: '500', color: '#1e293b' },
  separator: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 8 },
  obsCard: { backgroundColor: '#ffffff', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, },
  obsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  obsTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  obsText: { fontSize: 14, color: '#475569', lineHeight: 20 },
  footer: { padding: 24, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  participateButton: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center', },
  participateButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600', },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', },
  modalContent: { width: '90%', backgroundColor: '#ffffff', padding: 24, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', },
  modalInfo: { fontSize: 16, color: '#64748b', marginBottom: 8, },
  label: { fontSize: 16, fontWeight: '500', color: '#374151', marginTop: 12, marginBottom: 8, },
  modalInput: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 16, },
  modalButton: { backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24, },
  modalButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600', },
  finalizeButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
});