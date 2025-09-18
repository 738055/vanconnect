import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect } from 'expo-router';
import { Star, User } from 'lucide-react-native';

type Review = {
  id: number;
  rating: number;
  comment: string | null;
  reviewer_name: string;
};

export default function MyReviewsScreen() {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyReviews = useCallback(async () => {
    if (!profile) return;
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          reviewer_id
        `)
        .eq('reviewee_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // ✅ Solução: Buscar os nomes dos avaliadores separadamente
      const reviewerIds = data.map(review => review.reviewer_id);
      const { data: reviewers, error: reviewersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', reviewerIds);

      if (reviewersError) throw reviewersError;

      const reviewerMap = new Map(reviewers.map(r => [r.id, r.full_name]));

      const formattedReviews = data.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        reviewer_name: reviewerMap.get(review.reviewer_id) || 'Usuário Desconhecido',
      }));
      setReviews(formattedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      Alert.alert('Erro', 'Não foi possível carregar suas avaliações.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      fetchMyReviews();
    }, [fetchMyReviews])
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchMyReviews} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Minhas Avaliações</Text>
        </View>

        {reviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Você ainda não tem avaliações. Comece a criar transfers para recebê-las!</Text>
          </View>
        ) : (
          reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.userIconContainer}>
                  <User size={20} color="#64748b" />
                </View>
                <View>
                  <Text style={styles.reviewerName}>{review.reviewer_name}</Text>
                  {renderStars(review.rating)}
                </View>
              </View>
              {review.comment && (
                <Text style={styles.reviewComment}>{review.comment}</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { padding: 24, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { padding: 24, alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 16, color: '#64748b', textAlign: 'center' },
  reviewCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  userIconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  reviewerName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  starsContainer: { flexDirection: 'row', gap: 2, marginTop: 4 },
  reviewComment: { fontSize: 14, color: '#475569', lineHeight: 20 },
});