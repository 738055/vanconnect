<<<<<<< HEAD
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
=======
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { UserPlus, Trash2 } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
>>>>>>> 42a118eee7627d714b56b7e1bd1b715e1b916776

type Passenger = {
  full_name: string;
  phone: string;
  hotel: string;
};

export default function AddPassengersScreen() {
<<<<<<< HEAD
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
=======
  const router = useRouter();
  const { transferId, seatsRequested, totalPrice } = useLocalSearchParams();
  
  const numSeats = parseInt(seatsRequested as string);
  
  const [passengers, setPassengers] = useState<Passenger[]>(
    Array(numSeats).fill({ full_name: '', phone: '', hotel: '' })
  );
  const [loading, setLoading] = useState(false);

  const updatePassengerInfo = (index: number, field: keyof Passenger, value: string) => {
>>>>>>> 42a118eee7627d714b56b7e1bd1b715e1b916776
    const newPassengers = [...passengers];
    newPassengers[index] = { ...newPassengers[index], [field]: value };
    setPassengers(newPassengers);
  };

<<<<<<< HEAD
  const handleConfirmAndPay = async () => {
    if (!profile) return Alert.alert("Erro", "Você precisa estar logado.");
    for (const p of passengers) {
      if (!p.full_name.trim() || !p.phone.trim() || !p.hotel.trim()) {
        return Alert.alert('Erro de Validação', 'Nome, telefone e hotel são obrigatórios para todos os passageiros.');
=======
  const handleProceedToPayment = () => {
    for (const passenger of passengers) {
      if (!passenger.full_name.trim()) {
        Toast.show({ type: 'error', text1: 'Nome Obrigatório', text2: 'Por favor, preencha o nome de todos os passageiros.' });
        return;
>>>>>>> 42a118eee7627d714b56b7e1bd1b715e1b916776
      }
    }
    
    setLoading(true);

<<<<<<< HEAD
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
  
=======
    router.push({
      pathname: '/(app)/booking/pix-payment',
      params: {
        transferId,
        seatsRequested,
        totalPrice,
        passengers: JSON.stringify(passengers),
      },
    });
    setLoading(false);
  };

>>>>>>> 42a118eee7627d714b56b7e1bd1b715e1b916776
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Dados dos Passageiros</Text>
<<<<<<< HEAD
          <Text style={styles.subtitle}>Preencha os dados para as {numericSeatsRequested} vagas.</Text>
=======
          <Text style={styles.subtitle}>
            Preencha as informações para as {seatsRequested} vagas reservadas.
          </Text>
>>>>>>> 42a118eee7627d714b56b7e1bd1b715e1b916776
        </View>

        {passengers.map((_, index) => (
          <View key={index} style={styles.passengerCard}>
            <Text style={styles.passengerTitle}>Passageiro {index + 1}</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nome Completo *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome do passageiro"
                onChangeText={(text) => updatePassengerInfo(index, 'full_name', text)}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Telefone (Opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="(11) 99999-9999"
                keyboardType="phone-pad"
                onChangeText={(text) => updatePassengerInfo(index, 'phone', text)}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Hotel / Voo (Opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome do hotel ou número do voo"
                onChangeText={(text) => updatePassengerInfo(index, 'hotel', text)}
              />
            </View>
<<<<<<< HEAD
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
=======
          </View>
        ))}
      </ScrollView>
      <View style={styles.bottomBar}>
        <View>
            <Text style={styles.totalPrice}>R$ {totalPrice}</Text>
            <Text style={styles.priceLabel}>Total para {seatsRequested} vaga(s)</Text>
        </View>
        <TouchableOpacity style={styles.confirmButton} onPress={handleProceedToPayment} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmButtonText}>Ir para Pagamento</Text>}
>>>>>>> 42a118eee7627d714b56b7e1bd1b715e1b916776
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
<<<<<<< HEAD
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
=======
    header: { paddingHorizontal: 24, paddingVertical: 32 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#64748b' },
    passengerCard: { backgroundColor: '#ffffff', marginHorizontal: 24, marginBottom: 16, padding: 20, borderRadius: 16 },
    passengerTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 12 },
    inputContainer: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
    input: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 16 },
    bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
    totalPrice: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
    priceLabel: { fontSize: 14, color: '#64748b' },
    confirmButton: { backgroundColor: '#10b981', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center' },
    confirmButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
>>>>>>> 42a118eee7627d714b56b7e1bd1b715e1b916776
