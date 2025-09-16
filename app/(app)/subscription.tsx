import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  Star, 
  Crown, 
  Check, 
  Zap,
  Users,
  Building,
  TrendingUp
} from 'lucide-react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { supabase } from '../../lib/supabase';

interface Plan {
  id: 'free' | 'pro' | 'enterprise';
  name: string;
  price: number;
  period: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
  stripePriceId?: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'Sempre',
    icon: <Zap size={24} color="#64748b" />,
    color: '#64748b',
    features: [
      'Acesso ao perfil básico',
      'Visualizar transfers públicos',
      'Completar cadastro'
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29.90,
    period: 'mês',
    icon: <Star size={24} color="#f59e0b" />,
    color: '#f59e0b',
    stripePriceId: 'price_pro_monthly',
    features: [
      'Criar até 10 transfers por mês',
      'Participar de transfers',
      'Sistema de avaliações',
      'Histórico de viagens',
      'Suporte prioritário'
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99.90,
    period: 'mês',
    icon: <Crown size={24} color="#8b5cf6" />,
    color: '#8b5cf6',
    stripePriceId: 'price_enterprise_monthly',
    features: [
      'Transfers ilimitados',
      'Transfers privados',
      'Dashboard com relatórios',
      'Gerenciar motoristas',
      'API de integração',
      'Suporte 24/7'
    ],
  },
];

export default function SubscriptionScreen() {
  const { subscription, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: Plan) => {
    if (!plan.stripePriceId || !profile) return;

    setLoading(plan.id);
    
    try {
      // Create payment intent on your backend
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          userId: profile.id,
        }),
      });

      const { clientSecret, customer } = await response.json();

      // Initialize the payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'TransferApp',
        customerId: customer,
        paymentIntentClientSecret: clientSecret,
        defaultBillingDetails: {
          name: profile.full_name || '',
          email: profile.id, // You might want to use actual email
        },
      });

      if (initError) {
        Alert.alert('Erro', 'Falha ao inicializar pagamento');
        return;
      }

      // Present the payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        Alert.alert('Erro', 'Pagamento cancelado ou falhou');
        return;
      }

      // Payment succeeded - update subscription
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan: plan.id,
          status: 'active',
        })
        .eq('user_id', profile.id);

      if (updateError) throw updateError;

      await refreshProfile();
      
      Alert.alert(
        'Sucesso!', 
        `Parabéns! Você agora tem acesso ao plano ${plan.name}.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
      
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert('Erro', 'Não foi possível processar a assinatura');
    } finally {
      setLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      'Cancelar Assinatura',
      'Tem certeza que deseja cancelar sua assinatura? Você perderá o acesso às funcionalidades premium.',
      [
        { text: 'Não', style: 'cancel' },
        { 
          text: 'Sim, cancelar', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Here you would call your backend to cancel the Stripe subscription
              // For now, just update the local subscription
              const { error } = await supabase
                .from('subscriptions')
                .update({
                  plan: 'free',
                  status: 'canceled',
                })
                .eq('user_id', profile?.id);

              if (error) throw error;

              await refreshProfile();
              Alert.alert('Sucesso', 'Assinatura cancelada com sucesso');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível cancelar a assinatura');
            }
          }
        },
      ]
    );
  };

  const PlanCard = ({ plan }: { plan: Plan }) => {
    const isCurrentPlan = subscription?.plan === plan.id;
    const canUpgrade = subscription?.plan === 'free' && plan.id !== 'free';
    const canDowngrade = subscription?.plan !== 'free' && plan.id === 'free';

    return (
      <View style={[
        styles.planCard,
        isCurrentPlan && { borderColor: plan.color, borderWidth: 2 }
      ]}>
        {isCurrentPlan && (
          <View style={[styles.currentBadge, { backgroundColor: plan.color }]}>
            <Text style={styles.currentBadgeText}>Plano Atual</Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <View style={[styles.planIcon, { backgroundColor: `${plan.color}15` }]}>
            {plan.icon}
          </View>
          <View style={styles.planInfo}>
            <Text style={styles.planName}>{plan.name}</Text>
            <View style={styles.priceContainer}>
              <Text style={[styles.planPrice, { color: plan.color }]}>
                R$ {plan.price.toFixed(2)}
              </Text>
              <Text style={styles.planPeriod}>/{plan.period}</Text>
            </View>
          </View>
        </View>

        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Check size={16} color={plan.color} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.planButton,
            isCurrentPlan ? styles.currentPlanButton : { backgroundColor: plan.color },
            loading === plan.id && styles.loadingButton
          ]}
          onPress={() => {
            if (isCurrentPlan && subscription?.plan !== 'free') {
              handleCancelSubscription();
            } else if (canUpgrade) {
              handleSubscribe(plan);
            }
          }}
          disabled={loading !== null || (isCurrentPlan && plan.id === 'free')}
        >
          <Text style={[
            styles.planButtonText,
            isCurrentPlan && styles.currentPlanButtonText
          ]}>
            {loading === plan.id ? 'Processando...' : 
             isCurrentPlan ? (plan.id === 'free' ? 'Plano Atual' : 'Cancelar') :
             canUpgrade ? `Assinar ${plan.name}` :
             'Plano Atual'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#64748b" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Planos de Assinatura</Text>
          <Text style={styles.subtitle}>Escolha o plano ideal para você</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.currentPlanInfo}>
          <View style={styles.currentPlanCard}>
            <View style={styles.currentPlanHeader}>
              <Building size={24} color="#2563eb" />
              <Text style={styles.currentPlanTitle}>Plano Atual</Text>
            </View>
            <Text style={styles.currentPlanName}>
              {plans.find(p => p.id === subscription?.plan)?.name || 'Free'}
            </Text>
            <Text style={styles.currentPlanDescription}>
              {subscription?.plan === 'free' 
                ? 'Upgrade para desbloquear mais funcionalidades'
                : 'Obrigado por ser nosso cliente premium!'
              }
            </Text>
          </View>
        </View>

        <View style={styles.plansContainer}>
          <Text style={styles.sectionTitle}>Planos Disponíveis</Text>
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </View>

        <View style={styles.footer}>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <TrendingUp size={20} color="#10b981" />
              <Text style={styles.benefitText}>Sem taxa de setup</Text>
            </View>
            <View style={styles.benefitItem}>
              <Users size={20} color="#10b981" />
              <Text style={styles.benefitText}>Suporte dedicado</Text>
            </View>
            <View style={styles.benefitItem}>
              <Crown size={20} color="#10b981" />
              <Text style={styles.benefitText}>Cancele a qualquer momento</Text>
            </View>
          </View>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  scrollView: {
    flex: 1,
  },
  currentPlanInfo: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  currentPlanCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  currentPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  currentPlanTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  currentPlanName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  currentPlanDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  plansContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  currentBadge: {
    position: 'absolute',
    top: -1,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  planPeriod: {
    fontSize: 16,
    color: '#64748b',
  },
  featuresContainer: {
    marginBottom: 24,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  planButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  currentPlanButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  loadingButton: {
    opacity: 0.6,
  },
  planButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  currentPlanButtonText: {
    color: '#64748b',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  benefitsList: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#374151',
  },
});