// Em: app/(app)/booking/add-passengers.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { User, DollarSign } from 'lucide-react-native';
import { useStripe } from '@stripe/stripe-react-native';

type PassengerInput = {
  full_name: string;
  document_number: string;
};

export default function AddPassengersScreen() {
  const { transferId, seatsRequested, totalPrice } = useLocalSearchParams();
  const router = useRouter();
  const { profile } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [passengers, setPassengers] = useState<PassengerInput[]>([]);
  const [loading, setLoading] = useState(false);

  const numericSeats = Number(seatsRequested);

  useEffect(() => {
    if (numericSeats > 0) {
      setPassengers(
        Array.from({ length: numericSeats }, () => ({ full_name: '', document_number: '' }))
      );
    }
  }, [numericSeats]);

  const handleInputChange = (index: number, field: keyof PassengerInput, value: string) => {
    const newPassengers = [...passengers];
    newPassengers[index][field] = value;
    setPassengers(newPassengers);
  };

  const handleConfirmAndPay = async () => {
    if (!profile) return Alert.alert("Erro", "Você precisa estar logado.");
    for (const p of passengers) {
      if (!p.full_name.trim()) {
        return Alert.alert('Erro', 'O nome de todos os passageiros é obrigatório.');
      }
    }

    setLoading(true);
    try {
      // 1. Chamar a Edge Function para criar a participação e o payment intent
      const { data, error: functionError } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          transferId: transferId,
          seats: numericSeats,
          passengers: passengers,
        },
      });
      if (functionError) throw functionError;

      // 2. Inicializar o ecrã de pagamento do Stripe
      const { clientSecret } = data;
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "TransferApp",
        paymentIntentClientSecret: clientSecret,
      });
      if (initError) throw initError;

      // 3. Apresentar o ecrã de pagamento
      const { error: paymentError } = await presentPaymentSheet();
      if (paymentError) {
        if (paymentError.code !== 'Canceled') {
          Alert.alert('Erro no Pagamento', paymentError.message);
        }
      } else {
        Alert.alert('Pagamento Confirmado!', 'Sua reserva foi concluída com sucesso.', [
          { text: 'OK', onPress: () => router.replace('/(app)/(tabs)/my-participations') },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Erro na Reserva', err.data?.error || err.message || 'Ocorreu um problema.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Dados dos Passageiros</Text>
        </View>
        <View style={styles.form}>
          {passengers.map((passenger, index) => (
            <View key={index} style={styles.passengerCard}>
              <Text style={styles.passengerTitle}>Passageiro {index + 1}</Text>
              <Text style={styles.label}>Nome Completo *</Text>
              <TextInput style={styles.input} value={passenger.full_name} onChangeText={(v) => handleInputChange(index, 'full_name', v)} />
              <Text style={styles.label}>Documento (RG ou CPF)</Text>
              <TextInput style={styles.input} value={passenger.document_number} onChangeText={(v) => handleInputChange(index, 'document_number', v)} />
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Valor Total:</Text>
          <Text style={styles.priceValue}>R$ {Number(totalPrice).toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={[styles.saveButton, loading && styles.disabledButton]} onPress={handleConfirmAndPay} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <><DollarSign size={20} color="#ffffff" /><Text style={styles.saveButtonText}>Pagar e Confirmar</Text></>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
// ... (Copie os mesmos estilos do ficheiro que já lhe enviei anteriormente)
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    scrollView: { flex: 1 },
    header: { padding: 24, backgroundColor: '#ffffff' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
    form: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 },
    passengerCard: { backgroundColor: '#ffffff', padding: 20, borderRadius: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
    passengerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2563eb', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 12 },
    label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8, marginTop: 12 },
    input: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 16, },
    footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#ffffff', gap: 16 },
    priceContainer: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
    priceLabel: {fontSize: 16, color: '#475569'},
    priceValue: {fontSize: 22, fontWeight: 'bold', color: '#1e293b'},
    saveButton: { backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, minHeight: 54 },
    disabledButton: { backgroundColor: '#9ca3af' },
    saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});