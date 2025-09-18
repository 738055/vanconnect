import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Alert } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { useRouter, useFocusEffect } from 'expo-router';
import { Car, MapPin, Users, Star, MessageSquare, Clock, X, Search as SearchIcon } from 'lucide-react-native';

type TransferWithDetails = {
  id: string;
  departure_time: string;
  price_per_seat: number | null;
  total_seats: number;
  occupied_seats: number;
  observations: string | null;
  status: 'available' | 'full' | 'completed' | 'cancelled';
  creator_id: string;
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
  };
};

export default function HomeScreen() {
  const { profile } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('all');
  const [transfers, setTransfers] = useState<TransferWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [isObsModalVisible, setObsModalVisible] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferWithDetails | null>(null);

  const commonQuery = `
    id,
    creator_id,
    departure_time,
    price_per_seat,
    total_seats,
    occupied_seats,
    observations,
    status,
    transfer_types ( * ),
    profiles:creator_id (
      full_name,
      phone
    ),
    vehicles ( * )
  `;

  const fetchAllTransfers = async () => {
    const now = new Date().toISOString();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('transfers')
      .select(commonQuery)
      .eq('visibility', 'public')
      .in('status', ['available', 'full'])
      .gte('departure_time', now)
      .lte('departure_time', tomorrow.toISOString())
      .order('departure_time', { ascending: true });

    if (error) throw error;
    return data;
  };

  const fetchMyParticipations = async () => {
    if (!profile) return [];
    const { data, error } = await supabase
      .from('transfer_participations')
      .select(`transfers ( ${commonQuery} )`)
      .eq('participant_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(p => p.transfers).filter(Boolean);
  };

  const fetchMyTransfers = async () => {
    if (!profile) return [];
    const { data, error } = await supabase
      .from('transfers')
      .select(commonQuery)
      .eq('creator_id', profile.id)
      .order('departure_time', { ascending: false });

    if (error) throw error;
    return data;
  };

  const fetchDataForTab = useCallback(async (tab: string) => {
    setLoading(true);
    try {
      let data = [];
      if (tab === 'all') {
        data = await fetchAllTransfers();
      } else if (tab === 'participations') {
        data = await fetchMyParticipations();
      } else if (tab === 'myTransfers') {
        data = await fetchMyTransfers();
      }
      setTransfers(data as TransferWithDetails[] || []);
    } catch (error: any) {
      console.error(`Erro ao buscar dados para a aba ${tab}:`, error);
      Alert.alert(
        'Erro ao Carregar Viagens',
        `Não foi possível buscar os dados. Verifique sua conexão e as configurações do Supabase.\n\nDetalhes: ${error.message}`
      );
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      fetchDataForTab(activeTab);
    }, [activeTab, fetchDataForTab])
  );

  const openObsModal = (transfer: TransferWithDetails) => {
    setSelectedTransfer(transfer);
    setObsModalVisible(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const getAvailableSeats = (transfer: TransferWithDetails) => {
    return transfer.total_seats - transfer.occupied_seats;
  };

  const renderTransferCard = (transfer: TransferWithDetails) => (
    <View key={transfer.id} style={styles.transferCard}>
      <TouchableOpacity onPress={() => router.push({ pathname: '/(app)/transfer-details/[id]', params: { id: transfer.id } })}>
        <View style={styles.transferHeader}>
          <Text style={styles.transferTitle}>{transfer.transfer_types.title}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>R$ {transfer.price_per_seat?.toFixed(2) || '0.00'}</Text>
            <Text style={styles.priceLabel}>por vaga</Text>
          </View>
        </View>

        <View style={styles.vehicleInfoContainer}>
          {transfer.vehicles && (
            <View style={styles.vehicleInfoItem}>
              <Car size={16} color="#64748b" />
              <Text style={styles.vehicleInfoText}>{transfer.vehicles.model} ({transfer.vehicles.plate})</Text>
            </View>
          )}
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
          {transfer.observations && (
              <TouchableOpacity onPress={() => openObsModal(transfer)} style={styles.obsButton}>
                  <MessageSquare size={16} color="#64748b" />
              </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isObsModalVisible}
        onRequestClose={() => setObsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Observações do Transfer</Text>
              <TouchableOpacity onPress={() => setObsModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.obsTextModal}>{selectedTransfer?.observations || 'Nenhuma observação informada.'}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, {profile?.full_name?.split(' ')[0] || 'Usuário'}!</Text>
        <Text style={styles.subtitle}>Bem-vindo de volta</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'all' && styles.activeTab]} onPress={() => setActiveTab('all')}>
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>Próximas Viagens</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'participations' && styles.activeTab]} onPress={() => setActiveTab('participations')}>
          <Text style={[styles.tabText, activeTab === 'participations' && styles.activeTabText]}>Minhas Participações</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'myTransfers' && styles.activeTab]} onPress={() => setActiveTab('myTransfers')}>
          <Text style={[styles.tabText, activeTab === 'myTransfers' && styles.activeTabText]}>Meus Transfers</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => fetchDataForTab(activeTab)} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 50 }} />
        ) : transfers.length > 0 ? (
          transfers.map(renderTransferCard)
        ) : (
          <View style={styles.emptyState}>
            <SearchIcon size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Nenhum transfer encontrado</Text>
            <Text style={styles.emptyDescription}>Não há transfers para exibir nesta categoria no momento.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 16, backgroundColor: '#ffffff' },
    greeting: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
    subtitle: { fontSize: 16, color: '#64748b' },
    tabContainer: { flexDirection: 'row', paddingHorizontal: 24, backgroundColor: '#ffffff', paddingBottom: 16, gap: 8 },
    tab: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#f1f5f9' },
    activeTab: { backgroundColor: '#2563eb' },
    tabText: { fontWeight: '600', color: '#475569' },
    activeTabText: { color: '#ffffff' },
    scrollView: { flex: 1, padding: 24, paddingTop: 8 },
    emptyState: { alignItems: 'center', paddingVertical: 64 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: '#64748b', marginTop: 16, marginBottom: 8 },
    emptyDescription: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
    transferCard: { backgroundColor: '#ffffff', marginBottom: 16, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
    transferHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    transferTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b', flex: 1, marginRight: 16 },
    priceContainer: { alignItems: 'flex-end' },
    price: { fontSize: 20, fontWeight: 'bold', color: '#10b981' },
    priceLabel: { fontSize: 12, color: '#64748b' },
    vehicleInfoContainer: { flexDirection: 'row', gap: 24, marginBottom: 16, flexWrap: 'wrap' },
    vehicleInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    vehicleInfoText: { fontSize: 14, color: '#64748b' },
    starsContainer: { flexDirection: 'row', gap: 2 },
    routeContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
    routeItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
    routeText: { fontSize: 14, color: '#64748b', flex: 1 },
    routeArrow: { fontSize: 16, color: '#64748b', fontWeight: 'bold' },
    transferDetails: { flexDirection: 'row', gap: 24, marginBottom: 16 },
    detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    detailText: { fontSize: 14, color: '#64748b' },
    transferFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
    creatorInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
    creatorName: { fontSize: 14, fontWeight: '500', color: '#1e293b' },
    obsButton: { padding: 6, borderRadius: 8, backgroundColor: '#e2e8f0', marginLeft: 8 },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    modalContent: { width: '90%', maxHeight: '60%', backgroundColor: '#ffffff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
    obsTextModal: { fontSize: 16, color: '#1e293b', lineHeight: 24 },
});