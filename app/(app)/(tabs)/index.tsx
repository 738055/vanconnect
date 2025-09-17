import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Transfer } from '../../../types/database';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Truck, TrendingUp, Users, Star, Crown, Zap, Car, MapPin, Clock } from 'lucide-react-native';

type TransferWithDetails = Transfer & {
  transfer_types: {
    title: string;
    origin_description: string;
    destination_description: string;
  },
  profiles: {
    full_name: string;
    avatar_url: string;
    average_rating: number | null;
    reviews_count: number;
  },
  vehicles: {
    model: string;
    plate: string;
  }
};

export default function HomeScreen() {
  const { profile, subscription } = useAuth();
  const [recentTransfers, setRecentTransfers] = useState<TransferWithDetails[]>([]);
  const [stats, setStats] = useState({
    totalTransfers: 0,
    activeTransfers: 0,
    totalEarnings: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchData = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      
      const { data: transfersData, error: transfersError } = await supabase
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
            avatar_url,
            average_rating,
            reviews_count
          ),
          vehicles (
            model,
            plate
          )
        `)
        .gte('departure_time', today.toISOString())
        .lt('departure_time', dayAfterTomorrow.toISOString())
        .order('departure_time', { ascending: true });

      if (transfersError) throw transfersError;
      setRecentTransfers(transfersData as TransferWithDetails[] || []);

      const { data: myTransfers } = await supabase
        .from('transfers')
        .select('*', { count: 'exact' })
        .eq('creator_id', profile.id);

      const activeTransfers = myTransfers?.filter(t => 
        t.status === 'available' || t.status === 'full'
      ).length || 0;

      const totalEarnings = myTransfers?.reduce((sum, transfer) => {
        return sum + ((transfer.price_per_seat || 0) * transfer.occupied_seats);
      }, 0) || 0;

      setStats({
        totalTransfers: myTransfers?.length || 0,
        activeTransfers,
        totalEarnings,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [profile]));

  const getPlanIcon = () => {
    switch (subscription?.plan) {
      case 'pro':
        return <Star size={20} color="#f59e0b" />;
      case 'enterprise':
        return <Crown size={20} color="#8b5cf6" />;
      default:
        return <Zap size={20} color="#64748b" />;
    }
  };

  const getPlanName = () => {
    switch (subscription?.plan) {
      case 'pro':
        return 'Pro';
      case 'enterprise':
        return 'Enterprise';
      default:
        return 'Free';
    }
  };

  const getPlanColor = () => {
    switch (subscription?.plan) {
      case 'pro':
        return '#f59e0b';
      case 'enterprise':
        return '#8b5cf6';
      default:
        return '#64748b';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#10b981';
      case 'full': return '#f59e0b';
      case 'completed': return '#6b7280';
      case 'canceled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Disponível';
      case 'full': return 'Lotado';
      case 'completed': return 'Finalizado';
      case 'canceled': return 'Cancelado';
      default: return status;
    }
  };
  
  const renderFreeContent = () => (
    <View style={styles.upgradeSection}>
      <View style={styles.upgradeCard}>
        <View style={styles.upgradeHeader}>
          <Truck size={32} color="#2563eb" />
          <Text style={styles.upgradeTitle}>Desbloqueie todo o potencial!</Text>
        </View>
        <Text style={styles.upgradeDescription}>
          Upgrade para Pro e comece a criar e participar de transfers
        </Text>
        <TouchableOpacity 
          style={styles.upgradeButton}
          onPress={() => router.push('/(app)/subscription')}
        >
          <Text style={styles.upgradeButtonText}>Fazer Upgrade</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProEnterpriseContent = () => (
    <>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <TrendingUp size={24} color="#10b981" />
          <Text style={styles.statNumber}>{stats.totalTransfers}</Text>
          <Text style={styles.statLabel}>Total Transfers</Text>
        </View>
        <View style={styles.statCard}>
          <Users size={24} color="#2563eb" />
          <Text style={styles.statNumber}>{stats.activeTransfers}</Text>
          <Text style={styles.statLabel}>Ativos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>
            R$ {stats.totalEarnings.toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Faturamento</Text>
        </View>
      </View>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximos Transfers (Hoje e Amanhã)</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/transfers')}>
            <Text style={styles.sectionLink}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
           <View style={styles.emptyState}>
             <ActivityIndicator size="large" color="#2563eb" />
           </View>
        ) : recentTransfers.length > 0 ? (
          recentTransfers.map((transfer) => (
            <TouchableOpacity 
              key={transfer.id} 
              style={styles.transferCard} 
              onPress={() => router.push({ pathname: '/(app)/transfer-details/[id]', params: { id: transfer.id } })}
            >
              <View style={styles.transferHeader}>
                <Text style={styles.transferTitle}>{transfer.transfer_types.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transfer.status) }]}>
                  <Text style={styles.statusText}>{getStatusLabel(transfer.status)}</Text>
                </View>
              </View>
              
              <View style={styles.creatorInfo}>
                {transfer.profiles && (
                  <>
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>{transfer.profiles.full_name?.charAt(0) || 'U'}</Text>
                    </View>
                    <View style={styles.creatorDetails}>
                      <Text style={styles.creatorName}>{transfer.profiles.full_name}</Text>
                      {transfer.vehicles && (
                          <Text style={styles.vehicleDetails}>{transfer.vehicles.model} • {transfer.vehicles.plate}</Text>
                      )}
                    </View>
                  </>
                )}
              </View>

              <Text style={styles.transferRoute}>
                <MapPin size={14} color="#64748b" /> {transfer.transfer_types.origin_description} → {transfer.transfer_types.destination_description}
              </Text>
              <View style={styles.transferFooter}>
                <Text style={styles.transferSeats}>{transfer.occupied_seats}/{transfer.total_seats} vagas</Text>
                <Text style={styles.transferPrice}>R$ {transfer.price_per_seat?.toFixed(2) || '0.00'}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Truck size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Nenhum transfer encontrado</Text>
            <Text style={styles.emptyDescription}>Crie seu primeiro transfer ou participe de um existente</Text>
          </View>
        )}
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {profile?.full_name?.split(' ')[0] || 'Usuário'}!</Text>
            <Text style={styles.subtitle}>Bem-vindo ao TransferApp</Text>
          </View>
          <View style={[styles.planBadge, { borderColor: getPlanColor() }]}>
            {getPlanIcon()}
            <Text style={[styles.planText, { color: getPlanColor() }]}>{getPlanName()}</Text>
          </View>
        </View>
        {subscription?.plan === 'free' ? renderFreeContent() : renderProEnterpriseContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollView: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#ffffff',
  },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#64748b' },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  planText: { fontSize: 14, fontWeight: '600' },
  upgradeSection: { padding: 24 },
  upgradeCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  upgradeHeader: { alignItems: 'center', marginBottom: 16 },
  upgradeTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginTop: 8, textAlign: 'center' },
  upgradeDescription: { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 24, lineHeight: 24 },
  upgradeButton: { backgroundColor: '#2563eb', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  upgradeButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 16, gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4, textAlign: 'center' },
  section: { paddingHorizontal: 24, paddingBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  sectionLink: { fontSize: 16, color: '#2563eb', fontWeight: '500' },
  transferCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  transferHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  transferTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', flex: 1, marginRight: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, color: '#ffffff', fontWeight: '600' },
  transferRoute: { fontSize: 14, color: '#64748b', marginBottom: 12 },
  transferFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  transferSeats: { fontSize: 14, color: '#64748b' },
  transferPrice: { fontSize: 16, fontWeight: '600', color: '#10b981' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#64748b', marginTop: 16, marginBottom: 8 },
  emptyDescription: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
  // ✅ NOVOS ESTILOS
  creatorInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  creatorDetails: { flexDirection: 'column' },
  creatorName: { fontSize: 14, fontWeight: '500', color: '#1e293b' },
  vehicleDetails: { fontSize: 12, color: '#64748b' },
});