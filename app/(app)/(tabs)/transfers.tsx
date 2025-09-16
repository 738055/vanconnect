import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Transfer } from '../../../types/database';
import { useRouter } from 'expo-router';
import { Search, MapPin, Clock, Users, Filter } from 'lucide-react-native';

export default function TransfersScreen() {
  const { profile } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [filteredTransfers, setFilteredTransfers] = useState<Transfer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchTransfers = async () => {
    try {
      const { data, error } = await supabase
        .from('transfers')
        .select(`
          *,
          profiles!transfers_creator_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('visibility', 'public')
        .in('status', ['available', 'full'])
        .order('departure_time', { ascending: true });

      if (error) throw error;
      
      setTransfers(data || []);
      setFilteredTransfers(data || []);
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
      const filtered = transfers.filter(transfer =>
        transfer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transfer.origin_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transfer.destination_description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTransfers(filtered);
    }
  }, [searchQuery, transfers]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAvailableSeats = (transfer: Transfer) => {
    return transfer.total_seats - transfer.occupied_seats;
  };

  const handleRequestParticipation = async (transferId: number) => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('transfer_participations')
        .insert({
          transfer_id: transferId,
          participant_id: profile.id,
          seats_requested: 1,
          status: 'pending',
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          alert('Você já solicitou participação neste transfer!');
        } else {
          alert('Erro ao solicitar participação');
        }
      } else {
        alert('Solicitação enviada com sucesso!');
      }
    } catch (error) {
      console.error('Error requesting participation:', error);
      alert('Erro ao solicitar participação');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vitrine de Transfers</Text>
        <Text style={styles.subtitle}>Encontre e participe de viagens</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar transfers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchTransfers} />
        }
      >
        {filteredTransfers.length > 0 ? (
          filteredTransfers.map((transfer) => (
            <TouchableOpacity
              key={transfer.id}
              style={styles.transferCard}
              onPress={() => router.push(`/(app)/transfer-details/${transfer.id}`)}
            >
              <View style={styles.transferHeader}>
                <Text style={styles.transferTitle}>{transfer.title}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>R$ {transfer.price_per_seat?.toFixed(2) || '0.00'}</Text>
                  <Text style={styles.priceLabel}>por vaga</Text>
                </View>
              </View>

              <View style={styles.routeContainer}>
                <View style={styles.routeItem}>
                  <MapPin size={16} color="#64748b" />
                  <Text style={styles.routeText} numberOfLines={1}>
                    {transfer.origin_description}
                  </Text>
                </View>
                <Text style={styles.routeArrow}>→</Text>
                <View style={styles.routeItem}>
                  <MapPin size={16} color="#64748b" />
                  <Text style={styles.routeText} numberOfLines={1}>
                    {transfer.destination_description}
                  </Text>
                </View>
              </View>

              <View style={styles.transferDetails}>
                <View style={styles.detailItem}>
                  <Clock size={16} color="#64748b" />
                  <Text style={styles.detailText}>
                    {formatDate(transfer.departure_time)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Users size={16} color="#64748b" />
                  <Text style={styles.detailText}>
                    {getAvailableSeats(transfer)} vagas disponíveis
                  </Text>
                </View>
              </View>

              <View style={styles.transferFooter}>
                <View style={styles.creatorInfo}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {(transfer as any).profiles?.full_name?.charAt(0) || 'U'}
                    </Text>
                  </View>
                  <Text style={styles.creatorName}>
                    {(transfer as any).profiles?.full_name || 'Usuário'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.participateButton,
                    transfer.status === 'full' && styles.disabledButton
                  ]}
                  onPress={() => handleRequestParticipation(transfer.id)}
                  disabled={transfer.status === 'full'}
                >
                  <Text style={[
                    styles.participateButtonText,
                    transfer.status === 'full' && styles.disabledButtonText
                  ]}>
                    {transfer.status === 'full' ? 'Lotado' : 'Participar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Search size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Nenhum transfer encontrado</Text>
            <Text style={styles.emptyDescription}>
              Tente ajustar sua pesquisa ou aguarde por novos transfers
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  filterButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  transferCard: {
    backgroundColor: '#ffffff',
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  transferHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  transferTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 16,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
  },
  priceLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  routeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeText: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  routeArrow: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: 'bold',
  },
  transferDetails: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#64748b',
  },
  transferFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  creatorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  participateButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#e5e7eb',
  },
  participateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
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
    lineHeight: 20,
  },
});