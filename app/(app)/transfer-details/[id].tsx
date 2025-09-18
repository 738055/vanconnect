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
  Image
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { Car, MapPin, Clock, Users, MessageSquare, DollarSign, X, CheckCircle, Phone, Building, Star, User } from 'lucide-react-native';
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
    avatar_url: string | null;
  };
  vehicles: {
    model: string;
    plate: string;
  };
};

type PassengerDetail = {
  full_name: string;
  phone: string | null;
  hotel: string | null;
};

export default function TransferDetailsScreen() {
  const { id: transferId } = useLocalSearchParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [transfer, setTransfer] = useState<TransferDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isJoinModalVisible, setJoinModalVisible] = useState(false);
  const [seatsRequested, setSeatsRequested] = useState('');
  const [isCreator, setIsCreator] = useState(false);
  const [passengers, setPassengers] = useState<PassengerDetail[]>([]);
  const [passengersLoading, setPassengersLoading] = useState(false);
  
  const [creatorAverageRating, setCreatorAverageRating] = useState(0);
  const [creatorTotalReviews, setCreatorTotalReviews] = useState(0);

  const fetchTransferDetails = useCallback(async () => {
    if (!transferId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transfers')
        .select(`
          *,
          transfer_types(title, origin_description, destination_description),
          profiles:creator_id(
            full_name,
            phone,
            avatar_url
          ),
          vehicles(model, plate)
        `)
        .eq('id', transferId)
        .single();
      if (error) throw error;
      setTransfer(data as TransferDetails);

      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', data.creator_id);

      if (reviewsError) throw reviewsError;
      
      const totalReviews = reviewsData.length;
      const averageRating = totalReviews > 0 
        ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;

      setCreatorAverageRating(averageRating);
      setCreatorTotalReviews(totalReviews);

    } catch (error: any) {
      console.error("Erro ao buscar detalhes do transfer:", error);
      Alert.alert("Erro", "Não foi possível carregar os detalhes do transfer.");
    } finally {
      setLoading(false);
    }
  }, [transferId]);

  const fetchPassengers = useCallback(async () => {
    if (!transferId) return;
    setPassengersLoading(true);
    try {
      // ✅ A consulta foi ajustada para usar apenas o status 'pending'
      const { data: participations, error: participationsError } = await supabase
        .from('transfer_participations')
        .select('id')
        .eq('transfer_id', transferId)
        .eq('status', 'pending');

      if (participationsError) throw participationsError;
      
      const participationIds = participations.map(p => p.id);
      
      const { data: passengersData, error: passengersError } = await supabase
        .from('passengers')
        .select('full_name, phone, hotel')
        .in('participation_id', participationIds);

      if (passengersError) throw passengersError;
      
      setPassengers(passengersData as PassengerDetail[]);
    } catch (error: any) {
      console.error("Erro ao buscar passageiros:", error);
      Alert.alert("Erro", "Não foi possível carregar a lista de passageiros.");
    } finally {
      setPassengersLoading(false);
    }
  }, [transferId]);

  useFocusEffect(
    useCallback(() => {
      fetchTransferDetails();
    }, [fetchTransferDetails])
  );

  useEffect(() => {
    if (transfer?.creator_id && profile?.id) {
      setIsCreator(transfer.creator_id === profile.id);
    }
  }, [transfer, profile]);

  useEffect(() => {
    if (isCreator) {
      fetchPassengers();
    }
  }, [isCreator, fetchPassengers]);

  const formatPrice = (price: number) => `R$ ${price.toFixed(2)}`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const availableSeats = transfer ? transfer.total_seats - transfer.occupied_seats : 0;
  const isFull = availableSeats <= 0;

  const handleJoinTransfer = () => {
    const seats = parseInt(seatsRequested, 10);
    if (isNaN(seats) || seats <= 0) {
      Alert.alert("Erro", "Por favor, insira um número de vagas válido.");
      return;
    }
    if (seats > availableSeats) {
      Alert.alert("Aviso", `Não há vagas suficientes. Vagas disponíveis: ${availableSeats}`);
      return;
    }
    const totalPrice = seats * (transfer?.price_per_seat || 0);
    setJoinModalVisible(false);
    router.push({
      pathname: `/(app)/transfer-details/add-passengers`,
      params: { transferId: transfer?.id, seatsRequested: seats, totalPrice: totalPrice.toFixed(2) }
    });
  };

  const renderStars = (rating: number, totalReviews: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    const starColor = "#ffc107";
    const emptyStarColor = "#e4e5e9";

    const stars = [];
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} size={16} color={starColor} fill={starColor} />);
    }
    if (hasHalfStar) {
      stars.push(<Star key="half" size={16} color={starColor} fill={starColor} />);
    }
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={16} color={emptyStarColor} />);
    }
    return (
      <View style={styles.starsContainer}>
        {stars}
        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
        <Text style={styles.reviewCountText}>({totalReviews} avaliações)</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!transfer) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Transfer não encontrado.</Text>
      </View>
    );
  }
  
  const hasCreatorAvatar = transfer.profiles?.avatar_url;
  const creatorInitials = transfer.profiles?.full_name?.charAt(0) || '?';

  return (
    <SafeAreaView style={styles.container}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isJoinModalVisible}
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Entrar no Transfer</Text>
              <TouchableOpacity onPress={() => setJoinModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalInfo}>Quantas vagas você precisa?</Text>
            <Text style={styles.label}>Vagas disponíveis: {availableSeats}</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="Número de vagas"
              value={seatsRequested}
              onChangeText={setSeatsRequested}
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleJoinTransfer}>
              <Text style={styles.modalButtonText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTransferDetails} />}
      >
        <View style={styles.transferCard}>
          <Text style={styles.transferTitle}>{transfer.transfer_types.title}</Text>
          
          <TouchableOpacity 
            style={styles.creatorInfoContainer}
            onPress={() => router.push({ pathname: `/(app)/user-profile/${transfer.creator_id}` })}
          >
            {hasCreatorAvatar ? (
              <Image source={{ uri: transfer.profiles.avatar_url }} style={styles.creatorAvatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{creatorInitials}</Text>
              </View>
            )}
            <View style={styles.creatorDetails}>
              <Text style={styles.creatorName}>{transfer.profiles?.full_name || 'Usuário'}</Text>
              {renderStars(creatorAverageRating, creatorTotalReviews)}
            </View>
          </TouchableOpacity>

          <View style={styles.section}>
            <View style={styles.detailItem}><MapPin size={20} color="#64748b" /><Text style={styles.detailLabel}>Origem:</Text><Text style={styles.detailText}>{transfer.transfer_types.origin_description}</Text></View>
            <View style={styles.detailItem}><MapPin size={20} color="#64748b" /><Text style={styles.detailLabel}>Destino:</Text><Text style={styles.detailText}>{transfer.transfer_types.destination_description}</Text></View>
            <View style={styles.detailItem}><Clock size={20} color="#64748b" /><Text style={styles.detailLabel}>Horário:</Text><Text style={styles.detailText}>{formatDate(transfer.departure_time)}</Text></View>
            <View style={styles.detailItem}><Car size={20} color="#64748b" /><Text style={styles.detailLabel}>Veículo:</Text><Text style={styles.detailText}>{transfer.vehicles.model} ({transfer.vehicles.plate})</Text></View>
            <View style={styles.detailItem}><Users size={20} color="#64748b" /><Text style={styles.detailLabel}>Vagas:</Text><Text style={styles.detailText}>{isFull ? 'Lotado' : `${availableSeats} disponíveis de ${transfer.total_seats}`}</Text></View>
            <View style={styles.detailItem}><DollarSign size={20} color="#64748b" /><Text style={styles.detailLabel}>Preço por Vaga:</Text><Text style={styles.detailText}>{formatPrice(transfer.price_per_seat)}</Text></View>
          </View>

          {transfer.observations && (
            <View style={styles.section}>
              <View style={styles.detailItem}><MessageSquare size={20} color="#64748b" /><Text style={styles.detailLabel}>Observações:</Text></View>
              <Text style={styles.observationsText}>{transfer.observations}</Text>
            </View>
          )}

          {isCreator && (
            <View style={styles.passengersSection}>
              <Text style={styles.passengersTitle}>Passageiros Confirmados</Text>
              {passengersLoading ? (
                <ActivityIndicator size="small" color="#64748b" style={{ marginTop: 16 }} />
              ) : passengers.length > 0 ? (
                passengers.map((p, index) => (
                  <View key={index} style={styles.passengerCard}>
                    <View style={styles.detailItem}>
                      <User size={16} color="#64748b" />
                      <Text style={styles.passengerName}>{p.full_name}</Text>
                    </View>
                    {p.phone && (
                      <View style={styles.detailItem}>
                        <Phone size={16} color="#64748b" />
                        <Text style={styles.passengerContact}>{p.phone}</Text>
                      </View>
                    )}
                    {p.hotel && (
                      <View style={styles.detailItem}>
                        <Building size={16} color="#64748b" />
                        <Text style={styles.passengerContact}>{p.hotel}</Text>
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.noPassengersText}>Nenhum passageiro confirmado ainda.</Text>
              )}
            </View>
          )}

        </View>
      </ScrollView>

      {!isCreator && !isFull && (
        <View style={styles.bottomBar}>
          <Text style={styles.bottomBarPrice}>{formatPrice(transfer.price_per_seat)}</Text>
          <Text style={styles.bottomBarPriceLabel}>por vaga</Text>
          <TouchableOpacity style={styles.participateButton} onPress={() => setJoinModalVisible(true)}>
            <Text style={styles.participateButtonText}>Entrar no Transfer</Text>
          </TouchableOpacity>
        </View>
      )}

      {isCreator && transfer.status === 'available' && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.creatorActionButton}>
            <Text style={styles.creatorActionButtonText}>Gerenciar Transfer</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1, padding: 24 },
  transferCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  transferTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
  creatorInfoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, padding: 12, backgroundColor: '#f8fafc', borderRadius: 12 },
  creatorAvatar: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  creatorDetails: { marginLeft: 16 },
  creatorName: { fontSize: 18, fontWeight: '600', color: '#1e293b' },
  starsContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { fontSize: 14, fontWeight: '600', color: '#475569', marginLeft: 4 },
  reviewCountText: { fontSize: 14, color: '#94a3b8', marginLeft: 4 },
  section: { marginBottom: 20 },
  detailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 12 },
  detailLabel: { fontSize: 16, fontWeight: '600', color: '#334155', minWidth: 80 },
  detailText: { fontSize: 16, color: '#64748b', flex: 1 },
  observationsText: { fontSize: 16, color: '#475569', marginTop: 8, lineHeight: 24 },
  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 24, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  bottomBarPrice: { fontSize: 20, fontWeight: 'bold', color: '#10b981' },
  bottomBarPriceLabel: { fontSize: 12, color: '#64748b' },
  participateButton: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center', flex: 1, marginLeft: 16 },
  participateButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  creatorActionButton: { backgroundColor: '#f1f5f9', paddingVertical: 16, borderRadius: 12, alignItems: 'center', flex: 1 },
  creatorActionButtonText: { color: '#475569', fontSize: 16, fontWeight: '600' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { width: '90%', backgroundColor: '#ffffff', padding: 24, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  modalInfo: { fontSize: 16, color: '#64748b', marginBottom: 8 },
  label: { fontSize: 16, fontWeight: '500', color: '#374151', marginTop: 12, marginBottom: 8 },
  modalInput: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 16 },
  modalButton: { backgroundColor: '#10b981', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  modalButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  passengersSection: { marginTop: 20 },
  passengersTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 12 },
  passengerCard: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  passengerName: { fontSize: 16, fontWeight: '500', color: '#1e293b', marginLeft: 8 },
  passengerContact: { fontSize: 14, color: '#475569', marginLeft: 8 },
  noPassengersText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 16 },
});