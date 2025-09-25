import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { UserPlus, Trash2 } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

type Passenger = {
  full_name: string;
  phone: string;
  hotel: string;
};

export default function AddPassengersScreen() {
  const router = useRouter();
  const { transferId, seatsRequested, totalPrice } = useLocalSearchParams();
  
  const numSeats = parseInt(seatsRequested as string);
  
  const [passengers, setPassengers] = useState<Passenger[]>(
    Array(numSeats).fill({ full_name: '', phone: '', hotel: '' })
  );
  const [loading, setLoading] = useState(false);

  const updatePassengerInfo = (index: number, field: keyof Passenger, value: string) => {
    const newPassengers = [...passengers];
    newPassengers[index] = { ...newPassengers[index], [field]: value };
    setPassengers(newPassengers);
  };

  const handleProceedToPayment = () => {
    for (const passenger of passengers) {
      if (!passenger.full_name.trim()) {
        Toast.show({ type: 'error', text1: 'Nome Obrigatório', text2: 'Por favor, preencha o nome de todos os passageiros.' });
        return;
      }
    }
    
    setLoading(true);

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Dados dos Passageiros</Text>
          <Text style={styles.subtitle}>
            Preencha as informações para as {seatsRequested} vagas reservadas.
          </Text>
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
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
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
