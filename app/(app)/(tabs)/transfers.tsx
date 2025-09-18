import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, RefreshControl, Modal, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Transfer } from '../../../types/database';
import { useRouter, useFocusEffect } from 'expo-router';
import { Search, MapPin, Clock, Users, Filter, X, Car, Star, MessageSquare } from 'lucide-react-native';

type TransferWithDetails = Transfer & {
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

export default function TransfersScreen() {
  const { profile } = useAuth();
  const [transfers, setTransfers] = useState<TransferWithDetails[]>([]);
  const [filteredTransfers, setFilteredTransfers] = useState<TransferWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferWithDetails | null>(null);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transfers')
        .select(`
          *,
          transfer_types(*),
          profiles:creator_id(*),
          vehicles(*)
        `)
        .eq('status', 'available');

      if (error) {
        throw error;
      }
      setTransfers(data || []);
    } catch (error: any) {
      Alert.alert('Erro', `Não foi possível carregar os transfers: ${error.message}`);
      console.error('Error fetching transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchTransfers();
  }, []));

  useEffect(() => {
    const filterTransfers = () => {
      const query = searchQuery.toLowerCase();
      if (!query) {
        setFilteredTransfers(transfers);
        return;
      }

      const filtered = transfers.filter(transfer => {
        const route = `${transfer.transfer_types.origin_description} -> ${transfer.transfer_types.destination_description}`.toLowerCase();
        const transferType = transfer.transfer_types.title.toLowerCase();
        const vehicle = transfer.vehicles.model.toLowerCase();
        const creatorName = transfer.profiles.full_name.toLowerCase();
        return route.includes(query) || transferType.includes(query) || vehicle.includes(query) || creatorName.includes(query);
      });
      setFilteredTransfers(filtered);
    };

    filterTransfers();
  }, [searchQuery, transfers]);

  const renderTransferCard = (transfer: TransferWithDetails) => {
    const isFull = transfer.occupied_seats >= transfer.total_seats;
    return (
      <TouchableOpacity
        key={transfer.id}
        style={styles.transferCard}
        onPress={() => router.push(`/(app)/transfer-details/${transfer.id}`)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.transferTitle}>{transfer.transfer_types.title}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>R$ {transfer.price_per_seat?.toFixed(2) || '0.00'}</Text>
            <Text style={styles.pricePerSeatText}>por vaga</Text>
          </View>
        </View>

        <View style={styles.transferDetailsContainer}>
            <View style={styles.detailRow}>
              <Car size={16} color="#475569" />
              <Text style={styles.detailText}>{transfer.vehicles.model}</Text>
            </View>
            <View style={styles.detailRow}>
              <Clock size={16} color="#475569" />
              <Text style={styles.detailText}>{new Date(transfer.departure_time).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</Text>
            </View>
            <View style={styles.detailRow}>
              <MapPin size={16} color="#475569" />
              <Text style={styles.detailText} numberOfLines={1}>{transfer.transfer_types.origin_description} → {transfer.transfer_types.destination_description}</Text>
            </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.seatsInfo}>
            <Users size={16} color="#2563eb" />
            <Text style={styles.seatsText}>{transfer.occupied_seats} de {transfer.total_seats} vagas</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{isFull ? 'Lotado' : 'Disponível'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Encontre seu transfer</Text>
        <View style={styles.searchBar}>
          <Search size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar por rota, hotel ou motorista"
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      
      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#2563eb" /></View>
      ) : (
        <ScrollView style={styles.scrollView} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTransfers} />}>
          <View style={styles.transfersList}>
            {filteredTransfers.length > 0 ? (
              filteredTransfers.map(renderTransferCard)
            ) : (
              <View style={styles.centered}><Text style={styles.emptyText}>Nenhum transfer encontrado. Tente ajustar a busca.</Text></View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { backgroundColor: '#ffffff', padding: 24, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: '#1e293b' },
  scrollView: { flex: 1 },
  transfersList: { padding: 24, paddingTop: 16 },
  transferCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  transferTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', flex: 1, marginRight: 16 },
  priceContainer: { alignItems: 'flex-end' },
  priceText: { fontSize: 20, fontWeight: 'bold', color: '#10b981' },
  pricePerSeatText: { fontSize: 12, color: '#64748b' },
  transferDetailsContainer: { marginBottom: 16, gap: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 14, color: '#475569', flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
  seatsInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  seatsText: { fontSize: 14, fontWeight: '500', color: '#2563eb' },
  statusBadge: { backgroundColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 16, color: '#64748b', textAlign: 'center' },
});