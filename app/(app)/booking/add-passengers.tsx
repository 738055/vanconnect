// Em: app/(app)/booking/add-passengers.tsx

import React, { useEffect, useState, useCallback } from 'react';
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
import { User, Phone, Hotel, Plane, DollarSign } from 'lucide-react-native';
import { useStripe } from '@stripe/stripe-react-native';

type PassengerInput = {
  full_name: string;
  document_number: string;
  hotel: string;
  flight_number: string;
  phone: string;
};

export default function AddPassengersScreen() {
  const { transferId, seatsRequested, totalPrice, creatorId } = useLocalSearchParams();
  const router = useRouter();
  const { profile } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [passengers, setPassengers] = useState<PassengerInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentSheetInitialized, setPaymentSheetInitialized] = useState(false);

  const numericTransferId = Number(transferId);
  const numericSeatsRequested = Number(seatsRequested);
  const numericTotalPrice = parseFloat(totalPrice as string);

  const initializePaymentSheet = useCallback(async () => {
    try {
      if (!creatorId || !numericTotalPrice) {
        Alert.alert("Erro", "Dados essenciais para o pagamento não foram encontrados.");
        return;
      }

      setLoading(true);

      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(numericTotalPrice * 100), // Enviar em centavos
          transfer_creator_id: creatorId,
        }
      });
      if (error) throw new Error(error.message);
      
      const { client_secret } = data;
      if (!client_secret) throw new Error("Client secret do pagamento não foi recebido.");

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "TransferApp",
        paymentIntentClientSecret: client_secret,
        defaultBillingDetails: {
          name: profile?.full_name ?? 'Nome do Comprador',
        }
      });

      if (initError) throw initError;

      setPaymentSheetInitialized(true);
    } catch (err: any) {
      Alert.alert('Erro ao Preparar Pagamento', err.message);
    } finally {
      setLoading(false);
    }
  }, [numericTotalPrice, creatorId, profile]);

  useEffect(() => {
    if (numericSeatsRequested > 0) {
      setPassengers(
        Array.from({ length: numericSeatsRequested }, () => ({
          full_name: '', document_number: '', hotel: '', flight_number: '', phone: '',
        }))
      );
      initializePaymentSheet();
    }
  }, [numericSeatsRequested, initializePaymentSheet]);


  const handleInputChange = (index: number, field: keyof PassengerInput, value: string) => {
    const newPassengers = [...passengers];
    newPassengers[index][field] = value;
    setPassengers(newPassengers);
  };

  const handleConfirmAndPay = async () => {
    if (!profile) return Alert.alert("Erro", "Você precisa estar logado.");
    for (const p of passengers) {
      if (!p.full_name.trim() || !p.phone.trim() || !p.hotel.trim()) {
        return Alert.alert('Erro de Validação', 'Nome, telefone e hotel são obrigatórios para todos os passageiros.');
      }
    }
    
    setLoading(true);

    try {
        const { data: participationData, error: participationError } = await supabase
            .from('transfer_participations')
            .insert({
                transfer_id: numericTransferId,
                participant_id: profile.id,
                seats_requested: numericSeatsRequested,
                total_price: numericTotalPrice,
                status: 'pending' // Inicia como pendente
            })
            .select('id')
            .single();

        if (participationError) throw participationError;
        
        const { error: paymentError } = await presentPaymentSheet();
        
        if (paymentError) {
            await supabase.from('transfer_participations').delete().eq('id', participationData.id);
            if (paymentError.code !== 'Canceled') {
                Alert.alert('Erro no Pagamento', paymentError.message);
            }
        } else {
            // Se o pagamento for bem-sucedido, o webhook tratará da atualização do status.
            // Apenas adicionamos os passageiros.
            const passengerPayload = passengers.map(p => ({ ...p, participation_id: participationData.id }));
            const { error: passengersError } = await supabase.from('passengers').insert(passengerPayload);
            if (passengersError) throw passengersError;

            Alert.alert('Pagamento Confirmado!', 'Sua reserva foi concluída. O motorista será notificado.', [
                { text: 'OK', onPress: () => router.replace('/(app)/my-participations') },
            ]);
        }

    } catch (err: any) {
        Alert.alert('Erro na Reserva', `Não foi possível criar sua reserva: ${err.message}`);
    } finally {
        setLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Dados dos Passageiros</Text>
          <Text style={styles.subtitle}>Preencha os dados para as {numericSeatsRequested} vagas.</Text>
        </View>

        <View style={styles.form}>
          {passengers.map((passenger, index) => (
            <View key={index} style={styles.passengerCard}>
              <Text style={styles.passengerTitle}>Passageiro {index + 1}</Text>
              <Text style={styles.label}>Nome Completo *</Text>
              <TextInput style={styles.input} value={passenger.full_name} onChangeText={(v) => handleInputChange(index, 'full_name', v)} placeholder="Nome completo do passageiro" />
              <Text style={styles.label}>Documento (RG ou CPF)</Text>
              <TextInput style={styles.input} value={passenger.document_number} onChangeText={(v) => handleInputChange(index, 'document_number', v)} placeholder="Número do documento" />
              <Text style={styles.label}>Telefone do Cliente *</Text>
              <View style={styles.inputWithIcon}><Phone size={20} color="#64748b" /><TextInput style={styles.inputText} value={passenger.phone} onChangeText={(v) => handleInputChange(index, 'phone', v)} placeholder="(XX) XXXXX-XXXX" keyboardType="phone-pad" /></View>
              <Text style={styles.label}>Hotel *</Text>
              <View style={styles.inputWithIcon}><Hotel size={20} color="#64748b" /><TextInput style={styles.inputText} value={passenger.hotel} onChangeText={(v) => handleInputChange(index, 'hotel', v)} placeholder="Nome do hotel" /></View>
              <Text style={styles.label}>Número do Voo</Text>
              <View style={styles.inputWithIcon}><Plane size={20} color="#64748b" /><TextInput style={styles.inputText} value={passenger.flight_number} onChangeText={(v) => handleInputChange(index, 'flight_number', v)} placeholder="Ex: LA3540" /></View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Valor Total:</Text>
            <Text style={styles.priceValue}>R$ {numericTotalPrice.toFixed(2)}</Text>
        </View>
        <TouchableOpacity 
            style={[styles.saveButton, (loading || !paymentSheetInitialized) && styles.disabledButton]} 
            onPress={handleConfirmAndPay} 
            disabled={loading || !paymentSheetInitialized}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <><DollarSign size={20} color="#ffffff" /><Text style={styles.saveButtonText}>Pagar e Confirmar</Text></>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    scrollView: { flex: 1 },
    header: { padding: 24, backgroundColor: '#ffffff' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
    subtitle: { fontSize: 16, color: '#64748b', marginTop: 4 },
    form: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 },
    passengerCard: { backgroundColor: '#ffffff', padding: 20, borderRadius: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
    passengerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2563eb', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 12 },
    label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8, marginTop: 12 },
    input: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 16, },
    inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', gap: 12, },
    inputText: { flex: 1, fontSize: 16, paddingVertical: 14 },
    footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#ffffff', gap: 16 },
    priceContainer: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
    priceLabel: {fontSize: 16, color: '#475569'},
    priceValue: {fontSize: 22, fontWeight: 'bold', color: '#1e293b'},
    saveButton: { backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, minHeight: 54 },
    disabledButton: { backgroundColor: '#9ca3af' },
    saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});