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
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { useRouter, useFocusEffect } from 'expo-router';
import { 
  User, 
  Settings, 
  LogOut, 
  Star, 
  Car, 
  CreditCard, 
  Phone, 
  Mail,
  FileText,
  Crown,
  UserCheck // Ícone importado
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, profile, subscription, signOut } = useAuth();
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [transferCount, setTransferCount] = useState(0);
  // ✅ NOVO ESTADO PARA O CONTADOR DE PARTICIPAÇÕES
  const [participationCount, setParticipationCount] = useState(0);
  const router = useRouter();

  const fetchProfileStats = useCallback(async () => {
    if (!profile) return;

    try {
      // Buscar avaliações e calcular a média
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

      // Buscar contagem de veículos
      const { count: vehicleCountData } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', profile.id);
      setVehicleCount(vehicleCountData || 0);

      // Buscar contagem de transfers criados
      const { count: transferCountData } = await supabase
        .from('transfers')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', profile.id);
      setTransferCount(transferCountData || 0);

      // ✅ BUSCAR CONTAGEM DE PARTICIPAÇÕES
      const { count: participationCountData } = await supabase
        .from('transfer_participations')
        .select('*', { count: 'exact', head: true })
        .eq('participant_id', profile.id);
      setParticipationCount(participationCountData || 0);

    } catch (error) {
      console.error('Error fetching profile stats:', error);
    }
  }, [profile]);

  useFocusEffect(fetchProfileStats);

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

  const getPlanColor = () => {
    switch (subscription?.plan) {
      case 'pro': return '#f59e0b';
      case 'enterprise': return '#8b5cf6';
      default: return '#64748b';
    }
  };

  const getPlanName = () => {
    switch (subscription?.plan) {
      case 'pro': return 'Pro';
      case 'enterprise': return 'Enterprise';
      default: return 'Free';
    }
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

  const menuItems = [
    {
      icon: <Car size={24} color="#64748b" />,
      title: 'Meus Veículos',
      subtitle: `${vehicleCount} veículo${vehicleCount !== 1 ? 's' : ''} cadastrado${vehicleCount !== 1 ? 's' : ''}`,
      onPress: () => router.push('/(app)/vehicles'),
    },
    {
      icon: <FileText size={24} color="#64748b" />,
      title: 'Meus Transfers',
      subtitle: `${transferCount} transfer${transferCount !== 1 ? 's' : ''} criado${transferCount !== 1 ? 's' : ''}`,
      onPress: () => router.push('/(app)/my-transfers'),
    },
    // ✅ NOVO ITEM DE MENU ADICIONADO
    {
      icon: <UserCheck size={24} color="#64748b" />,
      title: 'Minhas Participações',
      subtitle: `${participationCount} participação${participationCount !== 1 ? 'ões' : ''}`,
      onPress: () => router.push('/(app)/my-participations'),
    },
    {
      icon: <CreditCard size={24} color="#64748b" />,
      title: 'Assinatura',
      subtitle: `Plano ${getPlanName()}`,
      onPress: () => router.push('/(app)/subscription'),
      showArrow: true,
    },
    {
      icon: <Settings size={24} color="#64748b" />,
      title: 'Configurações',
      subtitle: 'Preferências e privacidade',
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}><User size={40} color="#64748b" /></View>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{profile?.full_name || 'Usuário'}</Text>
            <View style={styles.userDetails}><Mail size={16} color="#64748b" /><Text style={styles.userEmail}>{user?.email}</Text></View>
            {profile?.phone && (<View style={styles.userDetails}><Phone size={16} color="#64748b" /><Text style={styles.userPhone}>{profile.phone}</Text></View>)}
          </View>
          <View style={[styles.planBadge, { borderColor: getPlanColor() }]}>
            {subscription?.plan === 'enterprise' ? <Crown size={18} color={getPlanColor()} /> : subscription?.plan === 'pro' ? <Star size={18} color={getPlanColor()} /> : <User size={18} color={getPlanColor()} />}
            <Text style={[styles.planText, { color: getPlanColor() }]}>{getPlanName()}</Text>
          </View>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.ratingContainer}>
              {renderStarsRating(averageRating)}
              <Text style={styles.ratingNumber}>{averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}</Text>
            </View>
            <Text style={styles.statLabel}>{totalReviews} avaliação{totalReviews !== 1 ? 'ões' : ''}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{transferCount}</Text>
            <Text style={styles.statLabel}>Transfers criados</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{vehicleCount}</Text>
            <Text style={styles.statLabel}>Veículos</Text>
          </View>
        </View>
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>{item.icon}</View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              {item.showArrow && (<Text style={styles.arrow}>›</Text>)}
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Sair da conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollView: { flex: 1 },
  header: { backgroundColor: '#ffffff', paddingHorizontal: 24, paddingVertical: 32, alignItems: 'center' },
  avatarContainer: { marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  userInfo: { alignItems: 'center', marginBottom: 16 },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  userDetails: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#64748b' },
  userPhone: { fontSize: 14, color: '#64748b' },
  planBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, gap: 6 },
  planText: { fontSize: 14, fontWeight: '600' },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#ffffff', padding: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  ratingContainer: { alignItems: 'center', marginBottom: 8 },
  starsContainer: { flexDirection: 'row', gap: 2, marginBottom: 4 },
  ratingNumber: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#64748b', textAlign: 'center' },
  menuContainer: { paddingHorizontal: 24, paddingTop: 8 },
  menuItem: { backgroundColor: '#ffffff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  menuIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 2 },
  menuSubtitle: { fontSize: 14, color: '#64748b' },
  arrow: { fontSize: 24, color: '#cbd5e1', fontWeight: '300' },
  logoutContainer: { paddingHorizontal: 24, paddingVertical: 32 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: '#fee2e2', gap: 8 },
  logoutText: { fontSize: 16, color: '#ef4444', fontWeight: '500' },
});