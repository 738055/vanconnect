// Em: app/(app)/(tabs)/profile.tsx

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { useRouter, useFocusEffect } from 'expo-router';
import { 
  User, 
  LogOut, 
  Star, 
  Car, 
  FileText, 
  Users, 
  ChevronRight, 
  UserCheck,
  Headset,
  Wallet 
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const [statsLoading, setStatsLoading] = useState(true);
  
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [transferCount, setTransferCount] = useState(0);
  const [participationCount, setParticipationCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const router = useRouter();

  const fetchProfileStats = useCallback(async () => {
    if (!profile) {
      setStatsLoading(false);
      return;
    }

    try {
      setStatsLoading(true);
      
      const { data: reviewsData } = await supabase.from('reviews').select('rating', { count: 'exact' }).eq('reviewee_id', profile.id);
      setTotalReviews(reviewsData?.length || 0);
      if (reviewsData && reviewsData.length > 0) {
        setAverageRating(reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length);
      } else {
        setAverageRating(0);
      }
      
      const { count: vCount } = await supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('owner_id', profile.id);
      setVehicleCount(vCount || 0);

      const { count: tCount } = await supabase.from('transfers').select('*', { count: 'exact', head: true }).eq('creator_id', profile.id);
      setTransferCount(tCount || 0);

      const { count: pCount } = await supabase.from('transfer_participations').select('*', { count: 'exact', head: true }).eq('participant_id', profile.id);
      setParticipationCount(pCount || 0);
      
      const { data: myTransfers } = await supabase.from('transfers').select('id').eq('creator_id', profile.id);
      const transferIds = myTransfers?.map(t => t.id) || [];
      if (transferIds.length > 0) {
        const { count: pendingCount } = await supabase.from('transfer_participations').select('*', { count: 'exact', head: true }).in('transfer_id', transferIds).eq('status', 'pending');
        setPendingRequestsCount(pendingCount || 0);
      } else {
        setPendingRequestsCount(0);
      }
    } catch (error) {
      console.error('Error fetching profile stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      fetchProfileStats();
    }, [fetchProfileStats])
  );

  const handleLogout = () => Alert.alert('Sair', 'Tem certeza que deseja sair?', [{ text: 'Cancelar', style: 'cancel' },{ text: 'Sair', style: 'destructive', onPress: signOut }]);
  
  const handleContactAdmin = () => {
    const phoneNumber = '5547997857969'; // Substitua pelo seu número
    const message = `Olá, sou ${profile?.full_name}, meu e-mail é ${user?.email}. Preciso de suporte.`;
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.'));
  };

  const menuSections = [
    {
      title: 'Sua Conta',
      items: [
        { name: 'Minha Carteira', icon: <Wallet color="#2563eb" size={20} />, screen: '/(app)/profile/wallet' },
        { name: 'Editar Perfil', icon: <User color="#2563eb" size={20} />, screen: '/(app)/edit-profile' },
        { name: 'Meus Veículos', icon: <Car color="#2563eb" size={20} />, screen: '/(app)/vehicles' },
        ...(pendingRequestsCount > 0 ? [{ name: 'Solicitações Pendentes', icon: <UserCheck color="#2563eb" size={20} />, screen: '/(app)/profile/pending-requests', badge: pendingRequestsCount }] : []),
      ]
    },
    {
      title: 'Sua Atividade',
      items: [
        { name: 'Meus Transfers', icon: <FileText color="#2563eb" size={20} />, screen: '/(app)/my-transfers', badge: transferCount },
        { name: 'Minhas Participações', icon: <Users color="#2563eb" size={20} />, screen: '/(app)/my-participations', badge: participationCount },
        { name: 'Minhas Avaliações', icon: <Star color="#2563eb" size={20} />, screen: '/(app)/profile/my-reviews', badge: totalReviews },
      ]
    },
    {
      title: 'Suporte',
      items: [{ name: 'Fale com o Suporte', icon: <Headset color="#2563eb" size={20} />, onPress: handleContactAdmin },]
    }
  ];

  const renderMenuItem = (item: any, index: number) => (
    <TouchableOpacity key={index} style={styles.menuItem} onPress={() => item.screen ? router.push(item.screen) : item.onPress()}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIcon}>{item.icon}</View>
        <Text style={styles.menuTitle}>{item.name}</Text>
      </View>
      <View style={styles.menuItemRight}>
        {item.badge > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{item.badge}</Text></View>}
        <ChevronRight size={24} color="#cbd5e1" />
      </View>
    </TouchableOpacity>
  );

  if (authLoading || !profile) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image source={{ uri: profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name}&background=2563eb&color=fff` }} style={styles.profileImage} />
          <Text style={styles.profileName}>{profile.full_name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}><Star size={24} color="#f59e0b" /><Text style={styles.statNumber}>{averageRating.toFixed(1)}</Text><Text style={styles.statLabel}>{totalReviews} avaliações</Text></View>
          <View style={styles.statItem}><Car size={24} color="#2563eb" /><Text style={styles.statNumber}>{transferCount}</Text><Text style={styles.statLabel}>transfers</Text></View>
          <View style={styles.statItem}><Users size={24} color="#10b981" /><Text style={styles.statNumber}>{participationCount}</Text><Text style={styles.statLabel}>participações</Text></View>
        </View>

        <View style={styles.menuContainer}>
          {menuSections.map((section, sectionIndex) => (
            <View key={sectionIndex}>
              <Text style={styles.menuSectionTitle}>{section.title}</Text>
              {section.items.map(renderMenuItem)}
            </View>
          ))}
        </View>

        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}><LogOut size={20} color="#ef4444" /><Text style={styles.logoutText}>Sair</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingVertical: 32, alignItems: 'center', backgroundColor: '#ffffff' },
  profileImage: { width: 96, height: 96, borderRadius: 48, marginBottom: 12 },
  profileName: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  profileEmail: { fontSize: 14, color: '#64748b' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', padding: 20, backgroundColor: '#ffffff', borderRadius: 16, marginHorizontal: 24, marginTop: -30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  statItem: { alignItems: 'center', gap: 4 },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  statLabel: { fontSize: 12, color: '#64748b' },
  menuContainer: { padding: 24 },
  menuSectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12, marginTop: 16 },
  menuItem: { backgroundColor: '#ffffff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  menuItemRight: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  badge: { backgroundColor: '#ef4444', borderRadius: 12, minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8, marginLeft: 10 },
  badgeText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  logoutContainer: { paddingHorizontal: 24, paddingBottom: 32 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fee2e2', paddingVertical: 16, borderRadius: 12, gap: 8 },
  logoutText: { fontSize: 16, color: '#ef4444', fontWeight: '600' },
});