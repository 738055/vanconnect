import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Vehicle } from '../../../types/database';
import { useFocusEffect, useRouter } from 'expo-router';
import { Calendar, Users, DollarSign, Car, ChevronDown, X } from 'lucide-react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";

type TransferType = {
  id: number;
  title: string;
  origin_description: string;
  destination_description: string;
};

export default function CreateTransferScreen() {
  const { profile, subscription } = useAuth();
  const [transferTypes, setTransferTypes] = useState<TransferType[]>([]);
  const [selectedTransferType, setSelectedTransferType] = useState<TransferType | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  
  const [observations, setObservations] = useState('');
  const [departureDate, setDepartureDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  
  const [totalSeats, setTotalSeats] = useState('');
  const [pricePerSeat, setPricePerSeat] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isEnterprise = subscription?.plan === 'enterprise';

  // ✅ Corrigindo a implementação de useFocusEffect
  useFocusEffect(
    useCallback(() => {
      async function fetchData() {
        if (!profile) return;
        try {
          const { data: typesData, error: typesError } = await supabase.from('transfer_types').select('*').eq('is_active', true);
          if (typesError) throw typesError;
          setTransferTypes(typesData || []);
    
          const { data: vehiclesData, error: vehiclesError } = await supabase.from('vehicles').select('*').eq('owner_id', profile.id);
          if (vehiclesError) throw vehiclesError;
          setVehicles(vehiclesData || []);
        } catch (error) {
          console.error('Error fetching data:', error);
          Alert.alert('Erro', 'Não foi possível carregar os dados necessários.');
        }
      }

      fetchData();
    }, [profile])
  );

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };
  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };
  const handleConfirmDate = (date: Date) => {
    setDepartureDate(date);
    hideDatePicker();
  };

  const handleCreateTransfer = async () => {
    if (!selectedTransferType || !selectedVehicle || !totalSeats || !pricePerSeat) {
        Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    if (!profile) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('transfers').insert({
        creator_id: profile.id,
        transfer_type_id: selectedTransferType.id,
        observations: observations.trim(),
        departure_time: departureDate.toISOString(),
        vehicle_id: selectedVehicle!,
        total_seats: parseInt(totalSeats),
        price_per_seat: parseFloat(pricePerSeat),
        visibility,
        status: 'available',
      });

      if (error) throw error;
      Alert.alert('Sucesso!', 'Transfer criado com sucesso', [{ text: 'OK', onPress: () => router.push('/(app)/(tabs)') }]);
    } catch (error) {
      console.error('Error creating transfer:', error);
      Alert.alert('Erro', 'Não foi possível criar o transfer');
    } finally {
      setLoading(false);
    }
  };

  const renderVehicleSelector = () => {
    if (vehicles.length === 0) {
      return (
        <View style={styles.noVehiclesContainer}>
          <Car size={32} color="#64748b" />
          <Text style={styles.noVehiclesTitle}>Nenhum veículo cadastrado</Text>
          <Text style={styles.noVehiclesDescription}>Você precisa cadastrar um veículo primeiro</Text>
          <TouchableOpacity style={styles.addVehicleButton} onPress={() => router.push('/(app)/vehicles/create')}>
            <Text style={styles.addVehicleButtonText}>Cadastrar Veículo</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Selecione o Veículo *</Text>
        {vehicles.map((vehicle) => (
          <TouchableOpacity
            key={vehicle.id}
            style={[styles.vehicleOption, selectedVehicle === vehicle.id && styles.selectedVehicle]}
            onPress={() => {
                setSelectedVehicle(vehicle.id);
                setTotalSeats(String(vehicle.total_seats)); 
            }}
          >
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleModel}>{vehicle.model}</Text>
              <Text style={styles.vehiclePlate}>Placa: {vehicle.plate}</Text>
              <Text style={styles.vehicleSeats}>{vehicle.total_seats} assentos</Text>
            </View>
            {selectedVehicle === vehicle.id && <View style={styles.selectedIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Modal para Selecionar Tipo de Transfer */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o Tipo de Transfer</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={transferTypes}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedTransferType(item);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemTitle}>{item.title}</Text>
                  <Text style={styles.modalItemSubtitle}>{item.origin_description} → {item.destination_description}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
      
      {/* Componente de Data/Hora Modal */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        onConfirm={handleConfirmDate}
        onCancel={hideDatePicker}
        minimumDate={new Date()}
        date={departureDate}
        locale="pt_BR"
        confirmTextIOS="Confirmar"
        cancelTextIOS="Cancelar"
      />

      <View style={styles.header}>
        <Text style={styles.title}>Criar Transfer</Text>
        <Text style={styles.subtitle}>Compartilhe sua viagem</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tipo de Transfer *</Text>
            <TouchableOpacity style={styles.selectButton} onPress={() => setModalVisible(true)}>
              <View style={{flex: 1}}>
                  <Text style={[styles.selectButtonText, !selectedTransferType && {color: '#9ca3af'}]}>
                    {selectedTransferType ? selectedTransferType.title : 'Selecione um tipo de transfer'}
                  </Text>
                  {selectedTransferType && 
                    <Text style={styles.selectButtonSubtitle}>
                        {selectedTransferType.origin_description} → {selectedTransferType.destination_description}
                    </Text>
                  }
              </View>
              <ChevronDown size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Observações</Text>
            <TextInput
              style={styles.textArea}
              value={observations}
              onChangeText={setObservations}
              placeholder="Ex: Ponto de encontro em frente ao portão de desembarque."
              multiline
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Data e Hora de Partida *</Text>
            <TouchableOpacity style={styles.inputWithIcon} onPress={showDatePicker}>
              <Calendar size={20} color="#64748b" />
              <Text style={styles.dateText}>
                {departureDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          </View>
          
          {renderVehicleSelector()}

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Vagas Disponíveis *</Text>
              <View style={styles.inputWithIcon}>
                <Users size={20} color="#64748b" />
                <TextInput style={styles.inputText} value={totalSeats} onChangeText={setTotalSeats} placeholder="0" keyboardType="numeric" />
              </View>
            </View>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Preço por Vaga *</Text>
              <View style={styles.inputWithIcon}>
                <DollarSign size={20} color="#64748b" />
                <TextInput style={styles.inputText} value={pricePerSeat} onChangeText={setPricePerSeat} placeholder="0.00" keyboardType="numeric" />
              </View>
            </View>
          </View>

          {isEnterprise && (
             <View style={styles.inputContainer}>
              <Text style={styles.label}>Visibilidade</Text>
              <View style={styles.visibilityContainer}>
                <TouchableOpacity style={[styles.visibilityOption, visibility === 'public' && styles.selectedVisibility]} onPress={() => setVisibility('public')}>
                  <Text style={[styles.visibilityText, visibility === 'public' && styles.selectedVisibilityText]}>Público</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.visibilityOption, visibility === 'private' && styles.selectedVisibility]} onPress={() => setVisibility('private')}>
                  <Text style={[styles.visibilityText, visibility === 'private' && styles.selectedVisibilityText]}>Privado</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity style={[styles.createButton, loading && styles.disabledButton]} onPress={handleCreateTransfer} disabled={loading}>
            <Text style={styles.createButtonText}>{loading ? 'Criando...' : 'Criar Transfer'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 24, paddingVertical: 32, backgroundColor: '#ffffff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#64748b' },
  scrollView: { flex: 1 },
  form: { paddingHorizontal: 24, paddingVertical: 24 },
  inputContainer: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '500', color: '#374151', marginBottom: 8 },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'space-between',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#1e293b',
  },
  selectButtonSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  textArea: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    height: 100,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', gap: 12 },
  inputText: { flex: 1, fontSize: 16, color: '#1e293b' },
  dateText: { flex: 1, fontSize: 16, color: '#1e293b' },
  row: { flexDirection: 'row', gap: 12 },
  halfWidth: { flex: 1 },
  vehicleSelector: { marginBottom: 24 },
  vehicleOption: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectedVehicle: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  vehicleInfo: { flex: 1 },
  vehicleModel: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 2 },
  vehiclePlate: { fontSize: 14, color: '#64748b', marginBottom: 2 },
  vehicleSeats: { fontSize: 14, color: '#64748b' },
  selectedIndicator: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#2563eb' },
  noVehiclesContainer: { backgroundColor: '#ffffff', padding: 32, borderRadius: 16, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#e5e7eb', borderStyle: 'dashed' },
  noVehiclesTitle: { fontSize: 18, fontWeight: '600', color: '#64748b', marginTop: 12, marginBottom: 8 },
  noVehiclesDescription: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  addVehicleButton: { backgroundColor: '#2563eb', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  addVehicleButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  visibilityContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4 },
  visibilityOption: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  selectedVisibility: { backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  visibilityText: { fontSize: 16, color: '#64748b', fontWeight: '500' },
  selectedVisibilityText: { color: '#2563eb', fontWeight: '600' },
  createButton: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  disabledButton: { opacity: 0.6 },
  createButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    height: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalItem: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  modalItemSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
});