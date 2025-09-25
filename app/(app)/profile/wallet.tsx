// Em: app/(app)/profile/wallet.tsx

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert, FlatList, RefreshControl } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { DollarSign } from 'lucide-react-native';
import { Transaction } from '../../../types/database';

export default function WalletScreen() {
  const { profile, refreshProfile } = useAuth();

  const fetchWalletData = async () => {
    if (!profile) throw new Error("Perfil não encontrado");
    
    // Atualiza o perfil para garantir que o saldo está correto
    await refreshProfile();

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Transaction[];
  };

  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ['walletData', profile?.id],
    queryFn: fetchWalletData,
    enabled: !!profile,
  });

  const handlePayout = async () => {
      Alert.alert(
          "Solicitar Saque",
          `Você está prestes a sacar R$ ${profile?.wallet_balance.toFixed(2)}. Esta ação enviará o valor para a sua conta Stripe conectada.`,
          [
              { text: 'Cancelar', style: 'cancel' },
              { 
                text: 'Confirmar Saque', 
                onPress: async () => {
                    // Aqui chamaremos uma futura Edge Function para processar o saque
                    Alert.alert("Sucesso", "A sua solicitação de saque foi enviada e será processada em breve.");
                    refetch();
                }
              }
          ]
      )
  };
  
  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
        <View style={styles.transactionDetails}>
            <Text style={styles.transactionDesc}>{item.description}</Text>
            <Text style={styles.transactionDate}>{new Date(item.created_at).toLocaleString('pt-BR', {dateStyle: 'short', timeStyle: 'short'})}</Text>
        </View>
        <Text style={[styles.transactionAmount, { color: item.type === 'earning' ? '#10b981' : '#ef4444' }]}>
            {item.type === 'earning' ? '+' : '-'} R$ {item.amount.toFixed(2)}
        </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <>
            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Saldo Disponível</Text>
                {isLoading && !profile?.wallet_balance ? <ActivityIndicator color="#fff" /> : <Text style={styles.balanceValue}>R$ {profile?.wallet_balance?.toFixed(2) || '0.00'}</Text>}
                <TouchableOpacity 
                    style={[styles.payoutButton, (profile?.wallet_balance || 0) <= 0 && styles.disabledButton]} 
                    disabled={(profile?.wallet_balance || 0) <= 0}
                    onPress={handlePayout}>
                    <DollarSign size={16} color="#2563eb" />
                    <Text style={styles.payoutButtonText}>Solicitar Saque</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.sectionTitle}>Histórico de Transações</Text>
          </>
        }
        ListEmptyComponent={!isLoading ? <Text style={styles.emptyText}>Nenhuma transação encontrada.</Text> : null}
        contentContainerStyle={styles.historySection}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  balanceCard: { backgroundColor: '#2563eb', marginBottom: 24, padding: 24, borderRadius: 16, alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10 },
  balanceLabel: { fontSize: 16, color: '#dbeafe' },
  balanceValue: { fontSize: 36, fontWeight: 'bold', color: '#ffffff' },
  payoutButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, marginTop: 12, gap: 8 },
  payoutButtonText: { color: '#2563eb', fontWeight: '600' },
  disabledButton: { opacity: 0.5 },
  historySection: { paddingHorizontal: 24, paddingBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 12 },
  transactionDetails: { flex: 1, marginRight: 12 },
  transactionDesc: { fontSize: 16, color: '#334155', fontWeight: '500' },
  transactionDate: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  transactionAmount: { fontSize: 16, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#64748b', marginTop: 20, fontSize: 16 }
});