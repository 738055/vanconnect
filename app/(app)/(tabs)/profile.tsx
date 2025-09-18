import React, { useState, useEffect, useCallback } from 'react';
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
  CreditCard, 
  FileText, 
  Users, 
  MessageSquare, 
  ChevronRight, 
  UserCheck,
  Headset,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, profile, subscription, signOut } = useAuth();
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [transferCount, setTransferCount] = useState(0);
  const [participationCount, setParticipationCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const fetchProfileStats = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', profile.id);

      if (reviewsData) {
        setTotalReviews(reviewsData.length);
        if (reviewsData.length > 0) {
          const avgRating = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length;
          setAverageRating(avgRating);
        } else {
          setAverageRating(0);
        }
      }

      const { count: vehicleCountData } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', profile.id);
      setVehicleCount(vehicleCountData || 0);

      const { count: transferCountData } = await supabase
        .from('transfers')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', profile.id);
      setTransferCount(transferCountData || 0);

      const { count: participationCountData } = await supabase
        .from('transfer_participations')
        .select('*', { count: 'exact', head: true })
        .eq('participant_id', profile.id);
      setParticipationCount(participationCountData || 0);
      
      const { data: myTransfers, error: transfersError } = await supabase
          .from('transfers')
          .select('id')
          .eq('creator_id', profile.id);
      if(transfersError) throw transfersError;

      const transferIds = myTransfers.map(t => t.id);

      if (transferIds.length > 0) {
          const { count: pendingCount } = await supabase
              .from('transfer_participations')
              .select('*', { count: 'exact', head: true })
              .in('transfer_id', transferIds)
              .eq('status', 'pending');
          setPendingRequestsCount(pendingCount || 0);
      } else {
          setPendingRequestsCount(0);
      }
    } catch (error) {
      console.error('Error fetching profile stats:', error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      fetchProfileStats();
    }, [fetchProfileStats])
  );

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: signOut },
      ]
    );
  };
  
  const handleContactAdmin = () => {
    const phoneNumber = '5547997857969';
    const message = `Olá, sou ${profile?.full_name}, meu e-mail é ${user?.email}. Gostaria de falar com o suporte.`;
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp. Por favor, verifique se o aplicativo está instalado.');
    });
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

  const menuSections = [
    {
      title: 'Sua Conta',
      items: [
        { name: 'Editar Perfil', icon: <User color="#2563eb" size={20} />, screen: 'edit-profile' },
        ...(vehicleCount > 0 ? [{ name: 'Meus Veículos', icon: <Car color="#2563eb" size={20} />, screen: 'vehicles' }] : []),
        ...(pendingRequestsCount > 0 ? [{ name: 'Solicitações Pendentes', icon: <UserCheck color="#2563eb" size={20} />, screen: 'pending-requests', badge: pendingRequestsCount }] : []),
      ]
    },
    {
      title: 'Sua Atividade',
      items: [
        { name: 'Meus Transfers', icon: <FileText color="#2563eb" size={20} />, screen: 'my-transfers', badge: transferCount },
        { name: 'Minhas Participações', icon: <Users color="#2563eb" size={20} />, screen: 'my-participations', badge: participationCount },
        { name: 'Minhas Avaliações', icon: <Star color="#2563eb" size={20} />, screen: 'my-reviews', badge: totalReviews },
      ]
    },
    {
      title: 'Suporte',
      items: [
        { name: 'Fale com o Administrador', icon: <Headset color="#2563eb" size={20} />, onPress: handleContactAdmin },
      ]
    }
  ];

  const renderMenuItem = (item: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.menuItem}
      // ✅ Usando um operador ternário para lidar com a navegação ou a função onPress
      onPress={() => item.screen ? router.push(`/(app)/profile/${item.screen}`) : item.onPress()}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIcon}>{item.icon}</View>
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>{item.name}</Text>
          {item.subtitle && <Text style={styles.menuSubtitle}>{item.subtitle}</Text>}
        </View>
      </View>
      {item.badge > 0 && (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationBadgeText}>{item.badge}</Text>
        </View>
      )}
      <ChevronRight size={24} color="#cbd5e1" />
    </TouchableOpacity>
  );

  if (loading || !profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.profileImage} />
          ) : (
            <Image source={{ uri: `https://ui-avatars.com/api/?name=${profile?.full_name}&background=2563eb&color=fff&bold=true` }} style={styles.profileImage} />
          )}
          <Text style={styles.profileName}>{profile?.full_name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/profile/edit-profile')} style={styles.editProfileButton}>
            <Text style={styles.editProfileText}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Star size={24} color="#f59e0b" />
            <Text style={styles.statNumber}>{averageRating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>{totalReviews} avaliações</Text>
          </View>
          <View style={styles.statItem}>
            <Car size={24} color="#2563eb" />
            <Text style={styles.statNumber}>{transferCount}</Text>
            <Text style={styles.statLabel}>transfers criados</Text>
          </View>
          <View style={styles.statItem}>
            <Users size={24} color="#10b981" />
            <Text style={styles.statNumber}>{participationCount}</Text>
            <Text style={styles.statLabel}>participações</Text>
          </View>
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
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingVertical: 32,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  profileImage: { width: 96, height: 96, borderRadius: 48, marginBottom: 12, borderWidth: 2, borderColor: '#fff' },
  profileName: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  profileEmail: { fontSize: 14, color: '#64748b' },
  editProfileButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 24,
    marginTop: -48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: { alignItems: 'center', gap: 4 },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  statLabel: { fontSize: 12, color: '#64748b', textAlign: 'center' },
  menuContainer: { padding: 24, paddingTop: 16 },
  menuSectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: 12, marginTop: 16 },
  menuItem: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  menuIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 2 },
  menuSubtitle: { fontSize: 14, color: '#64748b' },
  notificationBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 10,
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutContainer: { paddingHorizontal: 24, paddingBottom: 32 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: '#fee2e2', gap: 8 },
  logoutText: { fontSize: 16, color: '#ef4444', fontWeight: '500' },
  starsContainer: { flexDirection: 'row', gap: 2, marginBottom: 4 },
  notificationBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  arrow: { fontSize: 24, color: '#cbd5e1', fontWeight: '300' },
  notificationBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginLeft: 10,
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});