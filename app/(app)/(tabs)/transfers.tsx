import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, RefreshControl, Modal, Alert } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Transfer } from '../../../types/database';
import { useRouter } from 'expo-router';
import { Search, MapPin, Clock, Users, Filter, X } from 'lucide-react-native';

type TransferWithDetails = Transfer & {
  transfer_types: {
    title: string;
    origin_description: string;
    destination_description: string;
  },
  profiles: {
    full_name: string;
    avatar_url: string;
  }
};

export default function TransfersScreen() {
  const { profile } = useAuth();
  const [transfers, setTransfers] = useState<TransferWithDetails[]>([]);
  const [filteredTransfers, setFilteredTransfers] = useState<TransferWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Estados para o modal de solicitação
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferWithDetails | null>(null);
  const [seatsToRequest, setSeatsToRequest] = useState('1');

  const fetchTransfers = async () => {
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
          ),
          profiles!transfers_creator_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('visibility', 'public')
        .in('status', ['available', 'full'])
        .order('departure_time', { ascending: true });

      if (error) throw error;
      
      const availableTransfers = data.filter(t => t.creator_id !== profile?.id);
      setTransfers(availableTransfers as TransferWithDetails[] || []);
      setFilteredTransfers(availableTransfers as TransferWithDetails[] || []);
    } catch (error) {
      console.error('Error fetching transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTransfers(transfers);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = transfers.filter(transfer =>
        transfer.transfer_types.title.toLowerCase().includes(lowercasedQuery) ||
        transfer.transfer_types.origin_description?.toLowerCase().includes(lowercasedQuery) ||
        transfer.transfer_types.destination_description?.toLowerCase().includes(lowercasedQuery)
      );
      setFilteredTransfers(filtered);
    }
  }, [searchQuery, transfers]);

  const openParticipationModal = (transfer: TransferWithDetails) => {
    setSelectedTransfer(transfer);
    setSeatsToRequest('1');
    setModalVisible(true);
  };

  const handleConfirmParticipation = async () => {
    if (!profile || !selectedTransfer) return;

    const seats = parseInt(seatsToRequest);
    const availableSeats = getAvailableSeats(selectedTransfer);

    if (isNaN(seats) || seats <= 0) {
      Alert.alert('Erro', 'Por favor, insira um número de vagas válido.');
      return;
    }
    if (seats > availableSeats) {
      Alert.alert('Vagas Insuficientes', `Este transfer só tem ${availableSeats} vagas disponíveis.`);
      return;
    }

    const totalPrice = seats * (selectedTransfer.price_per_seat || 0);

    try {
      const { error } = await supabase
        .from('transfer_participations')
        .insert({
          transfer_id: selectedTransfer.id,
          participant_id: profile.id,
          seats_requested: seats,
          status: 'pending',
          total_price: totalPrice,
        });

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Atenção', 'Você já solicitou participação neste transfer!');
        } else {
          throw error;
        }
      } else {
        Alert.alert('Sucesso!', 'Sua solicitação foi enviada ao criador do transfer.');
      }
    } catch (error) {
      console.error('Error requesting participation:', error);
      Alert.alert('Erro', 'Não foi possível enviar sua solicitação.');
    } finally {
      setModalVisible(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const getAvailableSeats = (transfer: Transfer) => {
    return transfer.total_seats - transfer.occupied_seats;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Modal de Solicitação de Vagas */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Solicitar Vagas</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalTransferTitle}>{selectedTransfer?.transfer_types.title}</Text>
            <Text style={styles.modalInfo}>Vagas disponíveis: {selectedTransfer ? getAvailableSeats(selectedTransfer) : 0}</Text>
            <Text style={styles.modalInfo}>Preço por vaga: R$ {selectedTransfer?.price_per_seat?.toFixed(2) || '0.00'}</Text>
            
            <Text style={styles.label}>Quantas vagas você deseja?</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={seatsToRequest}
              onChangeText={setSeatsToRequest}
              placeholder="Ex: 2"
            />

            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmParticipation}>
              <Text style={styles.confirmButtonText}>Confirmar Solicitação</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.title}>Vitrine de Transfers</Text>
        <Text style={styles.subtitle}>Encontre e participe de viagens</Text>
      </View>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#64748b" />
          <TextInput style={styles.searchInput} placeholder="Buscar por título ou local..." value={searchQuery} onChangeText={setSearchQuery} />
        </View>
        <TouchableOpacity style={styles.filterButton}><Filter size={20} color="#64748b" /></TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTransfers} />}>
        {filteredTransfers.length > 0 ? (
          filteredTransfers.map((transfer) => (
            <View key={transfer.id} style={styles.transferCard}>
              <TouchableOpacity onPress={() => router.push(`/(app)/transfer-details/${transfer.id}`)}>
                <View style={styles.transferHeader}>
                  <Text style={styles.transferTitle}>{transfer.transfer_types.title}</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>R$ {transfer.price_per_seat?.toFixed(2) || '0.00'}</Text>
                    <Text style={styles.priceLabel}>por vaga</Text>
                  </View>
                </View>
                <View style={styles.routeContainer}>
                  <View style={styles.routeItem}><MapPin size={16} color="#64748b" /><Text style={styles.routeText} numberOfLines={1}>{transfer.transfer_types.origin_description}</Text></View>
                  <Text style={styles.routeArrow}>→</Text>
                  <View style={styles.routeItem}><MapPin size={16} color="#64748b" /><Text style={styles.routeText} numberOfLines={1}>{transfer.transfer_types.destination_description}</Text></View>
                </View>
                <View style={styles.transferDetails}>
                  <View style={styles.detailItem}><Clock size={16} color="#64748b" /><Text style={styles.detailText}>{formatDate(transfer.departure_time)}</Text></View>
                  <View style={styles.detailItem}><Users size={16} color="#64748b" /><Text style={styles.detailText}>{getAvailableSeats(transfer)} vagas disponíveis</Text></View>
                </View>
              </TouchableOpacity>
              <View style={styles.transferFooter}>
                <View style={styles.creatorInfo}>
                  <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>{(transfer.profiles?.full_name?.charAt(0) || 'U')}</Text></View>
                  <Text style={styles.creatorName}>{transfer.profiles?.full_name || 'Usuário'}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.participateButton, transfer.status === 'full' && styles.disabledButton]}
                  onPress={() => openParticipationModal(transfer)}
                  disabled={transfer.status === 'full'}
                >
                  <Text style={[styles.participateButtonText, transfer.status === 'full' && styles.disabledButtonText]}>
                    {transfer.status === 'full' ? 'Lotado' : 'Participar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Search size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Nenhum transfer encontrado</Text>
            <Text style={styles.emptyDescription}>Tente ajustar sua pesquisa ou aguarde por novos transfers</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { paddingHorizontal: 24, paddingVertical: 32, backgroundColor: '#ffffff' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
    subtitle: { fontSize: 16, color: '#64748b' },
    searchContainer: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#ffffff', gap: 12 },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 16, borderRadius: 12, gap: 8 },
    searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#1e293b' },
    filterButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12 },
    scrollView: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
    transferCard: { backgroundColor: '#ffffff', marginBottom: 16, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
    transferHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    transferTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b', flex: 1, marginRight: 16 },
    priceContainer: { alignItems: 'flex-end' },
    price: { fontSize: 20, fontWeight: 'bold', color: '#10b981' },
    priceLabel: { fontSize: 12, color: '#64748b' },
    routeContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
    routeItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
    routeText: { fontSize: 14, color: '#64748b', flex: 1 },
    routeArrow: { fontSize: 16, color: '#64748b', fontWeight: 'bold' },
    transferDetails: { flexDirection: 'row', gap: 24, marginBottom: 16 },
    detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    detailText: { fontSize: 14, color: '#64748b' },
    transferFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16, marginTop: 16 },
    creatorInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
    creatorName: { fontSize: 14, fontWeight: '500', color: '#1e293b' },
    participateButton: { backgroundColor: '#2563eb', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
    disabledButton: { backgroundColor: '#e5e7eb' },
    participateButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
    disabledButtonText: { color: '#9ca3af' },
    emptyState: { alignItems: 'center', paddingVertical: 64 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: '#64748b', marginTop: 16, marginBottom: 8 },
    emptyDescription: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
    // Estilos do Modal
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    modalContent: { width: '90%', backgroundColor: '#ffffff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
    modalTransferTitle: { fontSize: 16, fontWeight: '500', color: '#475569', marginBottom: 4 },
    modalInfo: { fontSize: 14, color: '#64748b', marginBottom: 16 },
    label: { fontSize: 16, fontWeight: '500', color: '#374151', marginBottom: 8 },
    modalInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 24 },
    confirmButton: { backgroundColor: '#10b981', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    confirmButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});