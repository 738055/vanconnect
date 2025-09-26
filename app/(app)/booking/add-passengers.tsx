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
import { User, DollarSign, Home, Plane } from 'lucide-react-native';

type PassengerInput = {
  full_name: string;
  document_number: string;
  hotel_address: string;
  flight_info: string;
};

export default function AddPassengersScreen() {
  const { transferId, seatsRequested, totalPrice } = useLocalSearchParams();
  const router = useRouter();
  const { profile } = useAuth();

  const [passengers, setPassengers] = useState<PassengerInput[]>([]);
  const [loading, setLoading] = useState(false);
  const numericSeats = Number(seatsRequested);

  useEffect(() => {
    if (numericSeats > 0) {
      setPassengers(
        Array.from({ length: numericSeats }, () => ({ 
          full_name: '', 
          document_number: '',
          hotel_address: '',
          flight_info: '' 
        }))
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
      if (!p.full_name.trim() || !p.hotel_address.trim() || !p.flight_info.trim()) {
        return Alert.alert('Erro', 'Nome, Hotel/Endereço e Voo são obrigatórios para todos os passageiros.');
      }
    }

    setLoading(true);
    try {
      // ✅ CORREÇÃO: O nome do campo foi alterado de 'seats' para 'seatsRequested'
      const { data, error: functionError } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          transferId: Number(transferId),
          seatsRequested: numericSeats,
          passengers: passengers,
        },
      });
      if (functionError) throw functionError;

      router.push({
        pathname: '/(app)/my-participations/pix-payment',
        params: {
          pixQrCodeUrl: data.pixQrCodeUrl,
          pixCode: data.pixCode,
          totalPrice: totalPrice,
        }
      });

    } catch (err: any) {
      Alert.alert('Erro ao Gerar PIX', err.message || 'Ocorreu um problema.');
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
              <TextInput style={styles.input} value={passenger.full_name} onChangeText={(v) => handleInputChange(index, 'full_name', v)} placeholder="Nome como no documento" />
              
              <Text style={styles.label}>Documento (RG ou CPF)</Text>
              <TextInput style={styles.input} value={passenger.document_number} onChangeText={(v) => handleInputChange(index, 'document_number', v)} placeholder="Opcional" />

              <Text style={styles.label}>Hotel ou Endereço *</Text>
              <View style={styles.inputWithIcon}>
                <Home size={20} color="#64748b" />
                <TextInput style={styles.inputText} value={passenger.hotel_address} onChangeText={(v) => handleInputChange(index, 'hotel_address', v)} placeholder="Ex: Hotel das Cataratas" />
              </View>

              <Text style={styles.label}>Voo de IN/OUT *</Text>
              <View style={styles.inputWithIcon}>
                 <Plane size={20} color="#64748b" />
                <TextInput style={styles.inputText} value={passenger.flight_info} onChangeText={(v) => handleInputChange(index, 'flight_info', v)} placeholder="Ex: GOL 1234, 15:30" />
              </View>
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
          {loading ? <ActivityIndicator color="#fff" /> : <><DollarSign size={20} color="#ffffff" /><Text style={styles.saveButtonText}>Gerar PIX para Pagamento</Text></>}
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
    form: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 },
    passengerCard: { backgroundColor: '#ffffff', padding: 20, borderRadius: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
    passengerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2563eb', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 12 },
    label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8, marginTop: 12 },
    input: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 16, },
    inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', gap: 12 },
    inputText: { flex: 1, fontSize: 16, paddingVertical: 14, color: '#1e293b' },
    footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#ffffff', gap: 16 },
    priceContainer: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
    priceLabel: {fontSize: 16, color: '#475569'},
    priceValue: {fontSize: 22, fontWeight: 'bold', color: '#1e293b'},
    saveButton: { backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, minHeight: 54 },
    disabledButton: { backgroundColor: '#9ca3af' },
    saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});