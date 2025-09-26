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
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { User, DollarSign, Home, Plane, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type PassengerInput = {
  full_name: string;
  document_number: string;
  hotel_address: string;
  flight_info: string;
};

const PassengerCard = ({ passenger, index, isExpanded, onToggle, onUpdate, onConfirm }: { passenger: PassengerInput; index: number; isExpanded: boolean; onToggle: () => void; onUpdate: (field: keyof PassengerInput, value: string) => void; onConfirm: () => void; }) => {
  const isComplete = passenger.full_name.trim() !== '' && passenger.hotel_address.trim() !== '' && passenger.flight_info.trim() !== '';
  return (
    <View style={styles.passengerCard}>
      <TouchableOpacity style={styles.passengerHeader} onPress={onToggle}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {isComplete ? <CheckCircle size={20} color="#10b981" /> : <AlertCircle size={20} color="#f59e0b" />}
          <Text style={styles.passengerTitle}>Passageiro {index + 1}</Text>
        </View>
        {isExpanded ? <ChevronUp size={24} color="#64748b" /> : <ChevronDown size={24} color="#64748b" />}
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.formContent}>
          <Text style={styles.label}>Nome Completo *</Text>
          <TextInput style={styles.input} value={passenger.full_name} onChangeText={(v) => onUpdate('full_name', v)} placeholder="Nome como no documento" />
          <Text style={styles.label}>Documento (RG ou CPF)</Text>
          <TextInput style={styles.input} value={passenger.document_number} onChangeText={(v) => onUpdate('document_number', v)} placeholder="Opcional" />
          <Text style={styles.label}>Hotel ou Endereço *</Text>
          <View style={styles.inputWithIcon}><Home size={20} color="#64748b" /><TextInput style={styles.inputText} value={passenger.hotel_address} onChangeText={(v) => onUpdate('hotel_address', v)} placeholder="Ex: Hotel das Cataratas" /></View>
          <Text style={styles.label}>Voo de IN/OUT *</Text>
          <View style={styles.inputWithIcon}><Plane size={20} color="#64748b" /><TextInput style={styles.inputText} value={passenger.flight_info} onChangeText={(v) => onUpdate('flight_info', v)} placeholder="Ex: GOL 1234, 15:30" /></View>
          <TouchableOpacity style={[styles.confirmPassengerButton, !isComplete && styles.disabledButton]} onPress={onConfirm} disabled={!isComplete}><Text style={styles.confirmPassengerButtonText}>Confirmar Passageiro</Text></TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default function AddPassengersScreen() {
  const { transferId, seatsRequested, totalPrice } = useLocalSearchParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [passengers, setPassengers] = useState<PassengerInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const numericSeats = Number(seatsRequested);

  useEffect(() => {
    if (numericSeats > 0) {
      setPassengers(Array.from({ length: numericSeats }, () => ({ full_name: '', document_number: '', hotel_address: '', flight_info: '' })));
    }
  }, [numericSeats]);

  const handleInputChange = (index: number, field: keyof PassengerInput, value: string) => {
    const newPassengers = [...passengers];
    newPassengers[index][field] = value;
    setPassengers(newPassengers);
  };
  
  const handleToggleCard = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleConfirmPassenger = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (index < passengers.length - 1) {
      setExpandedIndex(index + 1);
    } else {
      setExpandedIndex(null);
    }
  };
  
  const areAllPassengersValid = passengers.every(p => p.full_name.trim() && p.hotel_address.trim() && p.flight_info.trim());

  const handleConfirmAndPay = async () => {
    if (!profile) return Alert.alert("Erro", "Você precisa estar logado.");
    if (!areAllPassengersValid) {
        return Alert.alert('Erro', 'Por favor, preencha as informações obrigatórias para todos os passageiros.');
    }
    setLoading(true);
    try {
      const { data, error: functionError } = await supabase.functions.invoke('create-mock-payment-intent');
      if (functionError) throw functionError;

      router.push({
        pathname: '/(app)/my-participations/pix-payment',
        params: {
          pixQrCodeUrl: data.pixQrCodeUrl,
          pixCode: data.pixCode,
          totalPrice: totalPrice,
          transferId: transferId,
          seatsRequested: seatsRequested,
          passengers: JSON.stringify(passengers),
        }
      });
    } catch (err: any) {
      Alert.alert('Erro ao Gerar PIX (Simulado)', err.message || 'Ocorreu um problema.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}><Text style={styles.title}>Dados dos Passageiros</Text></View>
        <View style={styles.form}>
          {passengers.map((passenger, index) => (
            <PassengerCard key={index} passenger={passenger} index={index} isExpanded={expandedIndex === index} onToggle={() => handleToggleCard(index)} onUpdate={(field, value) => handleInputChange(index, field, value)} onConfirm={() => handleConfirmPassenger(index)} />
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.priceContainer}><Text style={styles.priceLabel}>Valor Total:</Text><Text style={styles.priceValue}>R$ {Number(totalPrice).toFixed(2)}</Text></View>
        <TouchableOpacity style={[styles.saveButton, (loading || !areAllPassengersValid) && styles.disabledButton]} onPress={handleConfirmAndPay} disabled={loading || !areAllPassengersValid}>
          {loading ? <ActivityIndicator color="#fff" /> : <><DollarSign size={20} color="#ffffff" /><Text style={styles.saveButtonText}>Gerar PIX para Pagamento</Text></>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { padding: 24, backgroundColor: '#ffffff' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
    form: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 },
    passengerCard: { backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, overflow: 'hidden' },
    passengerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    passengerTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b' },
    formContent: { padding: 20, paddingTop: 0 },
    label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8, marginTop: 12 },
    input: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 16 },
    inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', gap: 12 },
    inputText: { flex: 1, fontSize: 16, paddingVertical: 14, color: '#1e293b' },
    confirmPassengerButton: { backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    confirmPassengerButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
    footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#ffffff', gap: 16 },
    priceContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    priceLabel: { fontSize: 16, color: '#475569' },
    priceValue: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
    saveButton: { backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, minHeight: 54 },
    disabledButton: { opacity: 0.5 },
    saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});