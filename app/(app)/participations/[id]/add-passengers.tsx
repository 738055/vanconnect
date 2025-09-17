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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Phone, Plane, Hotel, DollarSign } from 'lucide-react-native';

type ParticipationDetails = {
  id: number;
  seats_requested: number;
  total_price: number;
};

type PassengerInput = {
  full_name: string;
  document_number: string;
  hotel: string;
  flight_number: string;
  phone: string;
};

export default function AddPassengersScreen() {
  const { id: participationId } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const fetchParticipationDetails = async (): Promise<ParticipationDetails> => {
    const { data, error } = await supabase
      .from('transfer_participations')
      .select('id, seats_requested, total_price')
      .eq('id', participationId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  };

  const { data: participation, isLoading } = useQuery({
    queryKey: ['participation-details', participationId],
    queryFn: fetchParticipationDetails,
  });

  const [passengers, setPassengers] = React.useState<PassengerInput[]>([]);
  const [pixCode, setPixCode] = useState<string>('pix_code_placeholder'); // Exemplo de estado para o código PIX

  React.useEffect(() => {
    if (participation?.seats_requested) {
      setPassengers(
        Array.from({ length: participation.seats_requested }, () => ({
          full_name: '',
          document_number: '',
          hotel: '',
          flight_number: '',
          phone: '',
        }))
      );
    }
  }, [participation]);

  const handleInputChange = (index: number, field: keyof PassengerInput, value: string) => {
    const newPassengers = [...passengers];
    newPassengers[index][field] = value;
    setPassengers(newPassengers);
  };

  const savePassengersMutation = useMutation({
    mutationFn: async (passengersToSave: PassengerInput[]) => {
      const payload = passengersToSave.map(p => ({
        participation_id: Number(participationId),
        full_name: p.full_name,
        document_number: p.document_number,
        hotel: p.hotel,
        flight_number: p.flight_number,
        phone: p.phone,
      }));

      const { error } = await supabase.from('passengers').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      Alert.alert('Sucesso', 'Passageiros salvos com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      queryClient.invalidateQueries({ queryKey: ['my-participations'] });
    },
    onError: (error) => {
      Alert.alert('Erro', 'Não foi possível salvar os passageiros.');
      console.error(error);
    },
  });

  const handleSaveAndPay = () => {
    for (const passenger of passengers) {
      if (!passenger.full_name.trim()) {
        Alert.alert('Erro', 'O nome de todos os passageiros é obrigatório.');
        return;
      }
    }
    savePassengersMutation.mutate(passengers);
    // ✅ Aqui é onde você chamaria a lógica para processar o pagamento PIX
  };

  if (isLoading || !participation) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Informar Passageiros</Text>
          <Text style={styles.subtitle}>
            Preencha os dados para as {participation.seats_requested} vagas que você solicitou.
          </Text>
        </View>
        <View style={styles.form}>
          {passengers.map((passenger, index) => (
            <View key={index} style={styles.passengerCard}>
              <Text style={styles.passengerTitle}>Passageiro {index + 1}</Text>
              <Text style={styles.label}>Nome Completo *</Text>
              <TextInput
                style={styles.input}
                value={passenger.full_name}
                onChangeText={(value) => handleInputChange(index, 'full_name', value)}
                placeholder="Nome completo do passageiro"
              />
              <Text style={styles.label}>Documento (RG ou CPF)</Text>
              <TextInput
                style={styles.input}
                value={passenger.document_number}
                onChangeText={(value) => handleInputChange(index, 'document_number', value)}
                placeholder="Número do documento"
              />
              
              <Text style={styles.label}>Telefone do Cliente</Text>
              <View style={styles.inputWithIcon}>
                  <Phone size={20} color="#64748b" />
                  <TextInput
                    style={styles.inputText}
                    value={passenger.phone}
                    onChangeText={(value) => handleInputChange(index, 'phone', value)}
                    placeholder="(XX) XXXXX-XXXX"
                    keyboardType="phone-pad"
                  />
              </View>

              <Text style={styles.label}>Hotel</Text>
              <View style={styles.inputWithIcon}>
                  <Hotel size={20} color="#64748b" />
                  <TextInput
                    style={styles.inputText}
                    value={passenger.hotel}
                    onChangeText={(value) => handleInputChange(index, 'hotel', value)}
                    placeholder="Nome do hotel"
                  />
              </View>

              <Text style={styles.label}>Número do Voo</Text>
              <View style={styles.inputWithIcon}>
                  <Plane size={20} color="#64748b" />
                  <TextInput
                    style={styles.inputText}
                    value={passenger.flight_number}
                    onChangeText={(value) => handleInputChange(index, 'flight_number', value)}
                    placeholder="Ex: LA3540"
                  />
              </View>
            </View>
          ))}
        </View>
        
        {/* ✅ NOVO: Seção de Pagamento PIX */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>Resumo do Pagamento</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Valor total:</Text>
            <Text style={styles.paymentValue}>R$ {participation.total_price.toFixed(2)}</Text>
          </View>
          <View style={styles.pixInfoContainer}>
            <Text style={styles.pixInfoTitle}>Pague com PIX</Text>
            <Text style={styles.pixCode}>{pixCode}</Text>
            <TouchableOpacity style={styles.copyButton}>
              <Text style={styles.copyButtonText}>Copiar Código PIX</Text>
            </TouchableOpacity>
            {/* ✅ Imagem do QR Code seria inserida aqui */}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, savePassengersMutation.isPending && styles.disabledButton]} 
          onPress={handleSaveAndPay}
          disabled={savePassengersMutation.isPending}
        >
          <DollarSign size={20} color="#ffffff" />
          <Text style={styles.saveButtonText}>
            {savePassengersMutation.isPending ? 'Salvando...' : 'Salvar Passageiros e Pagar'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  header: { padding: 24, backgroundColor: '#ffffff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 16, color: '#64748b', marginTop: 4 },
  form: { padding: 24 },
  passengerCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  passengerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2563eb', marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '500', color: '#374151', marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 16,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
  },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#ffffff' },
  saveButton: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  disabledButton: { opacity: 0.6 },
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  // ✅ NOVOS ESTILOS PARA PAGAMENTO
  paymentSection: {
    padding: 24,
  },
  paymentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  paymentLabel: {
    fontSize: 16,
    color: '#334155',
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  pixInfoContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  pixInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  pixCode: {
    fontSize: 14,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  copyButton: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
});