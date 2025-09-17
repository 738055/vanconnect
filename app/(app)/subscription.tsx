import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Check, Crown, Star } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

interface Plan {
  id: 'pro' | 'enterprise';
  name: string;
  price: number;
  period: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
}

const plans: Plan[] = [
    { id: 'pro', name: 'Pro', price: 29.90, period: 'mês', icon: <Star size={24} color="#f59e0b" />, color: '#f59e0b', features: ['Criar até 10 transfers por mês', 'Participar de transfers', 'Sistema de avaliações', 'Histórico de viagens', 'Suporte prioritário'], },
    { id: 'enterprise', name: 'Enterprise', price: 99.90, period: 'mês', icon: <Crown size={24} color="#8b5cf6" />, color: '#8b5cf6', features: ['Transfers ilimitados', 'Transfers privados', 'Dashboard com relatórios', 'Gerenciar motoristas', 'Suporte 24/7'], },
];

export default function SubscriptionScreen() {
  const { profile, refreshProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (plan: Plan) => {
    if (!profile) return;
    setLoading(plan.id);
    try {
      await supabase
        .from('subscriptions')
        .update({ plan: plan.id, status: 'active' })
        .eq('user_id', profile.id);

      await refreshProfile();
      
      Alert.alert(
        'Sucesso!', 
        `Parabéns! Você agora tem acesso ao plano ${plan.name}.`,
        [{ text: 'OK', onPress: () => router.replace('/') }] 
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar a assinatura');
    } finally {
      setLoading(null);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Escolha seu Plano</Text>
        <Text style={styles.subtitle}>Seu cadastro foi aprovado! Escolha um plano para começar.</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={styles.plansContainer}>
          {plans.map((plan) => (
            <View key={plan.id} style={[styles.planCard, { borderColor: plan.color }]}>
              <View style={styles.planHeader}>
                <View style={[styles.planIcon, { backgroundColor: `${plan.color}15` }]}>
                  {plan.icon}
                </View>
                <Text style={styles.planName}>{plan.name}</Text>
              </View>
              <Text style={styles.planPrice}>R$ {plan.price.toFixed(2)}<Text style={styles.planPeriod}>/mês</Text></Text>
              <View style={styles.featuresContainer}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Check size={16} color={plan.color} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.planButton, { backgroundColor: plan.color }, loading !== null && { opacity: 0.6 }]}
                onPress={() => handleSelectPlan(plan)}
                disabled={loading !== null}
              >
                {loading === plan.id ? 
                  <ActivityIndicator color="#ffffff" /> : 
                  <Text style={styles.planButtonText}>Selecionar Plano</Text>
                }
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { paddingHorizontal: 24, paddingVertical: 32, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
    subtitle: { fontSize: 16, color: '#64748b', marginTop: 4 },
    scrollView: { flex: 1 },
    plansContainer: { padding: 24 },
    planCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 24, marginBottom: 16, borderWidth: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
    planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    planIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    planName: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
    planPrice: { fontSize: 28, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
    planPeriod: { fontSize: 16, fontWeight: 'normal', color: '#64748b' },
    featuresContainer: { gap: 12, marginBottom: 24 },
    featureItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    featureText: { fontSize: 14, color: '#374151', flex: 1 },
    planButton: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    planButtonText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
});