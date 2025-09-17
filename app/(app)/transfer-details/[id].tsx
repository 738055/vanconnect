import React, { useState, useCallback } from 'react';
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
  Modal, // ✅ Importa o Modal
  TextInput, // ✅ Importa o TextInput
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { Car, Star, MapPin, Clock, Users, MessageSquare, DollarSign, X } from 'lucide-react-native'; // ✅ Adiciona o ícone X
import { useAuth } from '../../../contexts/AuthContext';

type TransferDetails = {
  id: number;
  departure_time: string;
  total_seats: number;
  occupied_seats: number;
  price_per_seat: number;
  observations: string | null;
  transfer_types: {
    title: string;
    origin_description: string;
    destination_description: string;
  };
  profiles: {
    full_name: string;
    avatar_url: string;
    average_rating: number | null;
    reviews_count: number;
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
  
  // ✅ NOVOS ESTADOS PARA O MODAL DE RESERVA
  const [isBookingModalVisible, setBookingModalVisible] = useState(false);
  const [seatsToBook, setSeatsToBook] = useState('1');

  const fetchTransferDetails = async () => {
    if (!transferId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transfers')
        .select(`
          *,
          transfer_types ( title, origin_description, destination_description ),
          profiles!transfers_creator_id_fkey ( full_name, avatar_url, average_rating, reviews_count ),
          vehicles ( model, plate )
        `)
        .eq('id', transferId)
        .single();
      
      if (error) {
        throw error;
      }
      setTransfer(data as TransferDetails);
    } catch (error) {
      console.error('Error fetching transfer details:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do transfer.');
      setTransfer(null);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchTransferDetails();
  }, [transferId]));

  const getAvailableSeats = () => transfer?.total_seats - transfer?.occupied_seats;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

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
    
    // ✅ LÓGICA DE NAVEGAÇÃO AJUSTADA PARA USAR UM NOVO ENDPOINT DE PIX MOCKUP
    router.push({
      pathname: '/(app)/my-participations/pix-payment', // ✅ NOVA ROTA
      params: {
        transferId: transfer?.id,
        seatsRequested: requestedSeats,
        totalPrice: (requestedSeats * (transfer?.price_per_seat || 0)).toFixed(2),
      }
    });

    setBookingModalVisible(false);
  };

  const renderStarsRating = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star key={i} size={16} color="#f59e0b" fill={i <= rating ? '#f59e0b' : '#e5e7eb'} />
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };
  
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!transfer) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Transfer não encontrado ou indisponível.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Modal de Reserva */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isBookingModalVisible}
        onRequestClose={() => setBookingModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reservar Vagas</Text>
              <TouchableOpacity onPress={() => setBookingModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalInfo}>Vagas disponíveis: {getAvailableSeats()}</Text>
            <Text style={styles.modalInfo}>Preço por vaga: R$ {transfer.price_per_seat?.toFixed(2) || '0.00'}</Text>
            
            <Text style={styles.label}>Quantas vagas você deseja?</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={seatsToBook}
              onChangeText={setSeatsToBook}
              placeholder="1"
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleBookNow}>
              <Text style={styles.modalButtonText}>Avançar para o Pagamento</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTransferDetails} />}
      >
        <View style={styles.header}>
          <Text style={styles.transferTitle}>{transfer.transfer_types.title}</Text>
          <Text style={styles.transferRoute}>
            <MapPin size={16} color="#64748b" /> {transfer.transfer_types.origin_description} → {transfer.transfer_types.destination_description}
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.profileCard}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{transfer.profiles?.full_name?.charAt(0) || 'U'}</Text>
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>{transfer.profiles?.full_name || 'Usuário'}</Text>
              <View style={styles.profileRating}>
                {renderStarsRating(transfer.profiles?.average_rating || 0)}
                <Text style={styles.reviewsText}>({transfer.profiles?.reviews_count || 0} avaliações)</Text>
              </View>
              {transfer.vehicles && (
                <View style={styles.vehicleInfo}>
                  <Car size={16} color="#475569" />
                  <Text style={styles.vehicleText}>{transfer.vehicles.model} ({transfer.vehicles.plate})</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.detailsCard}>
            <View style={styles.detailItem}>
              <Clock size={20} color="#2563eb" />
              <View>
                <Text style={styles.detailLabel}>Partida</Text>
                <Text style={styles.detailText}>{new Date(transfer.departure_time).toLocaleDateString()} às {new Date(transfer.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.detailItem}>
              <Users size={20} color="#2563eb" />
              <View>
                <Text style={styles.detailLabel}>Vagas</Text>
                <Text style={styles.detailText}>{getAvailableSeats()} de {transfer.total_seats} disponíveis</Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.detailItem}>
              <DollarSign size={20} color="#2563eb" />
              <View>
                <Text style={styles.detailLabel}>Preço</Text>
                <Text style={styles.detailText}>R$ {transfer.price_per_seat?.toFixed(2) || '0.00'} por vaga</Text>
              </View>
            </View>
          </View>

          {transfer.observations && (
            <View style={styles.obsCard}>
              <View style={styles.obsHeader}>
                <MessageSquare size={20} color="#2563eb" />
                <Text style={styles.obsTitle}>Observações</Text>
              </View>
              <Text style={styles.obsText}>{transfer.observations}</Text>
            </View>
          )}

        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.participateButton}
          onPress={() => setBookingModalVisible(true)}
        >
          <Text style={styles.participateButtonText}>Reservar e Pagar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollView: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#64748b' },
  header: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  transferTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  transferRoute: { fontSize: 16, color: '#64748b', flexDirection: 'row', alignItems: 'center', gap: 8 },
  content: { padding: 24, gap: 16 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarPlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#ffffff' },
  profileDetails: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '600', color: '#1e293b' },
  profileRating: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  reviewsText: { fontSize: 14, color: '#64748b' },
  starsContainer: { flexDirection: 'row', gap: 2 },
  vehicleInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 16, marginTop: 16 },
  vehicleText: { fontSize: 16, color: '#475569' },
  detailsCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    gap: 16,
  },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  detailLabel: { fontSize: 12, color: '#94a3b8' },
  detailText: { fontSize: 16, fontWeight: '500', color: '#1e293b' },
  separator: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 8 },
  obsCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  obsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  obsTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  obsText: { fontSize: 14, color: '#475569' },
  participateButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  participateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // ✅ NOVOS ESTILOS DO MODAL
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalInfo: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginTop: 12,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 16,
  },
  modalButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});