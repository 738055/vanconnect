import React, { useEffect, useState } from 'react';
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
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { User, Phone, Plane, Hotel, DollarSign, Clipboard } from 'lucide-react-native';

type PassengerInput = {
  full_name: string;
  document_number: string;
  hotel: string;
  flight_number: string;
  phone: string;
};

export default function AddPassengersScreen() {
  const { transferId, seatsRequested, totalPrice } = useLocalSearchParams();
  const router = useRouter();
  const { profile } = useAuth();

  const [passengers, setPassengers] = useState<PassengerInput[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [pixCode, setPixCode] = useState('Gerando código PIX...');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const numericTransferId = Number(transferId);
  const numericSeatsRequested = Number(seatsRequested);
  const numericTotalPrice = parseFloat(totalPrice as string);

  useEffect(() => {
    if (numericSeatsRequested) {
      setPassengers(
        Array.from({ length: numericSeatsRequested }, () => ({
          full_name: '', document_number: '', hotel: '', flight_number: '', phone: '',
        }))
      );
      createStripePixPayment();
    }
  }, [numericSeatsRequested]);

  const createStripePixPayment = async () => {
    console.log("Simulando criação de PIX no Stripe para o valor de R$", numericTotalPrice.toFixed(2));
    setTimeout(() => {
        const generatedCode = `chave_pix_simulada_valor_${numericTotalPrice.toFixed(2)}`;
        setPixCode(generatedCode);
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${generatedCode}`);
    }, 1500);
  };

  const handleInputChange = (index: number, field: keyof PassengerInput, value: string) => {
    const newPassengers = [...passengers];
    newPassengers[index][field] = value;
    setPassengers(newPassengers);
  };

  const handleConfirmReservation = async () => {
    if (!profile) {
      Alert.alert("Erro", "Você precisa estar logado para fazer uma reserva.");
      return;
    }
    
    for (const passenger of passengers) {
      if (!passenger.full_name.trim()) {
        Alert.alert('Erro de Validação', 'O nome de todos os passageiros é obrigatório.');
        return;
      }
    }

    setLoading(true);

    try {
      const isPaid = true; 
      
      if (!isPaid) {
        Alert.alert('Pagamento Pendente', 'Aguardando confirmação do pagamento PIX.');
        setLoading(false);
        return;
      }

      const { data: newParticipationId, error: rpcError } = await supabase.rpc('handle_successful_payment', {
        p_transfer_id: numericTransferId,
        p_participant_id: profile.id,
        p_seats_requested: numericSeatsRequested,
        p_total_price: numericTotalPrice
      });

      if (rpcError) throw rpcError;

      const passengerPayload = passengers.map(p => ({
          participation_id: newParticipationId, ...p
      }));
      
      const { error: passengersError } = await supabase.from('passengers').insert(passengerPayload);
      if (passengersError) throw passengersError;

      Alert.alert('Reserva Confirmada!', 'Sua reserva foi concluída com sucesso.', [
        { text: 'OK', onPress: () => router.push('/(app)/(tabs)/my-participations') },
      ]);

    } catch (error: any) {
      console.error('Erro ao confirmar reserva:', error);
      Alert.alert('Erro', `Ocorreu um problema ao registrar sua reserva: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!numericSeatsRequested) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Adicionar Passageiros</Text>
          <Text style={styles.subtitle}>Preencha os dados para as {numericSeatsRequested} vagas reservadas.</Text>
        </View>

        <View style={styles.form}>
          {passengers.map((passenger, index) => (
            <View key={index} style={styles.passengerCard}>
              <Text style={styles.passengerTitle}>Passageiro {index + 1}</Text>
              <Text style={styles.label}>Nome Completo *</Text>
              <TextInput style={styles.input} value={passenger.full_name} onChangeText={(v) => handleInputChange(index, 'full_name', v)} placeholder="Nome completo do passageiro" />
              <Text style={styles.label}>Documento (RG ou CPF)</Text>
              <TextInput style={styles.input} value={passenger.document_number} onChangeText={(v) => handleInputChange(index, 'document_number', v)} placeholder="Número do documento" />
              <Text style={styles.label}>Telefone do Cliente</Text>
              <View style={styles.inputWithIcon}><Phone size={20} color="#64748b" /><TextInput style={styles.inputText} value={passenger.phone} onChangeText={(v) => handleInputChange(index, 'phone', v)} placeholder="(XX) XXXXX-XXXX" keyboardType="phone-pad" /></View>
              <Text style={styles.label}>Hotel</Text>
              <View style={styles.inputWithIcon}><Hotel size={20} color="#64748b" /><TextInput style={styles.inputText} value={passenger.hotel} onChangeText={(v) => handleInputChange(index, 'hotel', v)} placeholder="Nome do hotel" /></View>
              <Text style={styles.label}>Número do Voo</Text>
              <View style={styles.inputWithIcon}><Plane size={20} color="#64748b" /><TextInput style={styles.inputText} value={passenger.flight_number} onChangeText={(v) => handleInputChange(index, 'flight_number', v)} placeholder="Ex: LA3540" /></View>
            </View>
          ))}
        </View>

        <View style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>Pagamento</Text>
          <View style={styles.paymentRow}><Text style={styles.paymentLabel}>Valor total:</Text><Text style={styles.paymentValue}>R$ {numericTotalPrice.toFixed(2)}</Text></View>
          <View style={styles.pixInfoContainer}>
            <Text style={styles.pixInfoTitle}>Pague com PIX</Text>
            {qrCodeUrl ? <Image source={{ uri: qrCodeUrl }} style={styles.qrCode} /> : <ActivityIndicator style={{marginVertical: 75}}/>}
            <Text style={styles.pixCode}>{pixCode}</Text>
            <TouchableOpacity style={styles.copyButton}><Clipboard size={16} color="#475569" /><Text style={styles.copyButtonText}>Copiar Código PIX</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.saveButton, loading && styles.disabledButton]} onPress={handleConfirmReservation} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <><DollarSign size={20} color="#ffffff" /><Text style={styles.saveButtonText}>Confirmar Reserva</Text></>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Estilos
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollView: { flex: 1 },
    header: { padding: 24, backgroundColor: '#ffffff' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
    subtitle: { fontSize: 16, color: '#64748b', marginTop: 4 },
    form: { paddingHorizontal: 24, paddingTop: 24 },
    passengerCard: { backgroundColor: '#ffffff', padding: 20, borderRadius: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, },
    passengerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2563eb', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 12 },
    label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8, marginTop: 12 },
    input: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 16, },
    inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', gap: 12, },
    inputText: { flex: 1, fontSize: 16, paddingVertical: 14 },
    footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#ffffff' },
    saveButton: { backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    disabledButton: { opacity: 0.6 },
    saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
    paymentSection: { padding: 24, },
    paymentTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 16, },
    paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, backgroundColor: '#ffffff', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, },
    paymentLabel: { fontSize: 16, color: '#334155', },
    paymentValue: { fontSize: 16, fontWeight: 'bold', color: '#10b981', },
    pixInfoContainer: { backgroundColor: '#ffffff', padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, },
    pixInfoTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 8, },
    qrCode: { width: 150, height: 150, resizeMode: 'contain', marginBottom: 12 },
    pixCode: { fontSize: 14, color: '#64748b', backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 16, textAlign: 'center' },
    copyButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#e2e8f0', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, },
    copyButtonText: { fontSize: 14, fontWeight: '600', color: '#475569', },
});