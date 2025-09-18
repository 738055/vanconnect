import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { User, Star, MessageSquare } from 'lucide-react-native';

type UserProfile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  email: string;
};

type Review = {
  id: number;
  rating: number;
  comment: string | null;
  reviewer_name: string;
};

export default function UserProfileScreen() {
  const { id: userId } = useLocalSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // ✅ Consulta ajustada para buscar as colunas corretas
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`id, full_name, avatar_url, phone, email`)
        .eq('id', userId)
        .single();
      if (profileError) throw profileError;
      setProfile(profileData as UserProfile);

      // Fetch reviews for the user
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`id, rating, comment, reviewer_id`)
        .eq('reviewee_id', userId)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;
      
      const reviewerIds = reviewsData.map(review => review.reviewer_id);
      const { data: reviewers, error: reviewersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', reviewerIds);

      if (reviewersError) throw reviewersError;
      const reviewerMap = new Map(reviewers.map(r => [r.id, r.full_name]));

      const formattedReviews = reviewsData.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        reviewer_name: reviewerMap.get(review.reviewer_id) || 'Usuário Desconhecido',
      }));
      setReviews(formattedReviews);
      
      const avgRating = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length || 0;
      setAverageRating(parseFloat(avgRating.toFixed(1)));
      setTotalReviews(reviewsData.length);

    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Erro', `Não foi possível carregar o perfil do usuário: ${error.message}`);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [fetchUserProfile])
  );

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star key={i} size={20} color="#f59e0b" fill={i <= rating ? '#f59e0b' : '#e5e7eb'} />
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

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Perfil do usuário não encontrado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchUserProfile} />
        }
      >
        <View style={styles.header}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.profileImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{profile.full_name[0]}</Text>
            </View>
          )}
          <Text style={styles.profileName}>{profile.full_name}</Text>
          <View style={styles.ratingContainer}>
            {renderStars(averageRating)}
            <Text style={styles.totalReviewsText}>{averageRating.toFixed(1)} ({totalReviews} avaliações)</Text>
          </View>
        </View>

        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>Avaliações ({totalReviews})</Text>
          {reviews.length === 0 ? (
            <Text style={styles.noReviewsText}>Este usuário ainda não tem avaliações.</Text>
          ) : (
            reviews.map(review => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerAvatarPlaceholder}>
                    <Text style={styles.reviewerAvatarText}>{review.reviewer_name[0]}</Text>
                  </View>
                  <View>
                    <Text style={styles.reviewerName}>{review.reviewer_name}</Text>
                    {renderStars(review.rating)}
                  </View>
                </View>
                {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#64748b' },
  header: {
    padding: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  profileImage: { width: 96, height: 96, borderRadius: 48, marginBottom: 12 },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 48, fontWeight: 'bold', color: '#ffffff' },
  profileName: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  starsContainer: { flexDirection: 'row', gap: 2 },
  totalReviewsText: { fontSize: 14, color: '#64748b' },
  reviewsSection: { paddingHorizontal: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  noReviewsText: { fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 24 },
  reviewCard: { backgroundColor: '#ffffff', padding: 20, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  reviewerAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  reviewerAvatarText: { fontSize: 16, fontWeight: 'bold', color: '#64748b' },
  reviewerName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  reviewComment: { fontSize: 14, color: '#475569', lineHeight: 20 },
});