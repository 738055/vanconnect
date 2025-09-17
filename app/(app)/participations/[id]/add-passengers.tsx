import React from 'react';
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
import { User } from 'lucide-react-native';

type ParticipationDetails = {
  id: number;
  seats_requested: number;
};

type PassengerInput = {
  full_name: string;
  document_number: string;
};

export default function AddPassengersScreen() {
  const { id: participationId } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Busca os detalhes da participação para saber quantas vagas foram solicitadas
  const fetchParticipationDetails = async (): Promise<ParticipationDetails> => {
    const { data, error } = await supabase
      .from('transfer_participations')
      .select('id, seats_requested')
      .eq('id', participationId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  };

  const { data: participation, isLoading } = useQuery({
    queryKey: ['participation-details', participationId],
    queryFn: fetchParticipationDetails,
  });

  // Estado para guardar os dados dos passageiros que o usuário digita
  const [passengers, setPassengers] = React.useState<PassengerInput[]>([]);

  // Quando os detalhes da participação carregam, cria o número correto de campos no formulário
  React.useEffect(() => {
    if (participation?.seats_requested) {
      setPassengers(
        Array.from({ length: participation.seats_requested }, () => ({
          full_name: '',
          document_number: '',
        }))
      );
    }
  }, [participation]);

  const handleInputChange = (index: number, field: keyof PassengerInput, value: string) => {
    const newPassengers = [...passengers];
    newPassengers[index][field] = value;
    setPassengers(newPassengers);
  };

  // Mutação para salvar os passageiros no banco de dados
  const savePassengersMutation = useMutation({
    mutationFn: async (passengersToSave: PassengerInput[]) => {
      const payload = passengersToSave.map(p => ({
        participation_id: Number(participationId),
        full_name: p.full_name,
        document_number: p.document_number,
      }));

      const { error } = await supabase.from('passengers').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      Alert.alert('Sucesso', 'Passageiros salvos com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      // Invalida a query de participações para que a tela anterior possa ser atualizada
      queryClient.invalidateQueries({ queryKey: ['my-participations'] });
    },
    onError: (error) => {
      Alert.alert('Erro', 'Não foi possível salvar os passageiros.');
      console.error(error);
    },
  });

  const handleSavePassengers = () => {
    for (const passenger of passengers) {
      if (!passenger.full_name.trim()) {
        Alert.alert('Erro', 'O nome de todos os passageiros é obrigatório.');
        return;
      }
    }
    savePassengersMutation.mutate(passengers);
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
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, savePassengersMutation.isPending && styles.disabledButton]} 
          onPress={handleSavePassengers}
          disabled={savePassengersMutation.isPending}
        >
          <Text style={styles.saveButtonText}>
            {savePassengersMutation.isPending ? 'Salvando...' : 'Salvar Passageiros'}
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
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#ffffff' },
  saveButton: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  disabledButton: { opacity: 0.6 },
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});