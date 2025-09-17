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
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Vehicle } from '../../../types/database';
// ✅ 1. Importar useFocusEffect
import { useFocusEffect, useRouter } from 'expo-router';
import { MapPin, Calendar, Users, DollarSign, Car } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateTransferScreen() {
  const { profile, subscription } = useAuth();
  const [title, setTitle] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [totalSeats, setTotalSeats] = useState('');
  const [pricePerSeat, setPricePerSeat] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isEnterprise = subscription?.plan === 'enterprise';

  const fetchVehicles = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('owner_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };
  
  // ✅ 2. Substituir o useEffect por useFocusEffect para sempre buscar veículos novos
  useFocusEffect(
    useCallback(() => {
      fetchVehicles();
    }, [profile]) // Adicionado profile como dependência por segurança
  );


  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDepartureDate(selectedDate);
    }
  };

  const validateForm = () => {
    if (!title.trim() || !origin.trim() || !destination.trim()) {
      Alert.alert('Erro', 'Título, origem e destino são obrigatórios');
      return false;
    }
    if (!selectedVehicle) {
      Alert.alert('Erro', 'Selecione um veículo');
      return false;
    }
    if (!totalSeats || parseInt(totalSeats) <= 0) {
      Alert.alert('Erro', 'Número de vagas deve ser maior que zero');
      return false;
    }
    
    // ✅ 3. Adicionar validação de capacidade do veículo
    const vehicle = vehicles.find(v => v.id === selectedVehicle);
    if (vehicle && parseInt(totalSeats) > vehicle.total_seats) {
      Alert.alert(
        'Erro de Capacidade',
        `O número de vagas (${totalSeats}) excede a capacidade do veículo selecionado (${vehicle.total_seats}).`
      );
      return false;
    }
    
    if (!pricePerSeat || parseFloat(pricePerSeat) < 0) {
      Alert.alert('Erro', 'Preço por vaga deve ser um valor válido');
      return false;
    }
    if (departureDate <= new Date()) {
      Alert.alert('Erro', 'Data de partida deve ser no futuro');
      return false;
    }
    return true;
  };

  const handleCreateTransfer = async () => {
    if (!validateForm() || !profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('transfers')
        .insert({
          creator_id: profile.id,
          vehicle_id: selectedVehicle!,
          title: title.trim(),
          origin_description: origin.trim(),
          destination_description: destination.trim(),
          departure_time: departureDate.toISOString(),
          total_seats: parseInt(totalSeats),
          price_per_seat: parseFloat(pricePerSeat),
          visibility,
          status: 'available',
        });

      if (error) throw error;

      Alert.alert(
        'Sucesso!', 
        'Transfer criado com sucesso',
        [{ text: 'OK', onPress: () => router.back() }]
      );
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
          <Text style={styles.noVehiclesDescription}>
            Você precisa cadastrar um veículo primeiro
          </Text>
          {/* ✅ 4. Ativar o botão de navegação */}
          <TouchableOpacity 
            style={styles.addVehicleButton}
            onPress={() => router.push('/(app)/vehicles/create')} // Rota de exemplo
          >
            <Text style={styles.addVehicleButtonText}>Cadastrar Veículo</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.vehicleSelector}>
        <Text style={styles.label}>Selecione o Veículo *</Text>
        {vehicles.map((vehicle) => (
          <TouchableOpacity
            key={vehicle.id}
            style={[
              styles.vehicleOption,
              selectedVehicle === vehicle.id && styles.selectedVehicle
            ]}
            onPress={() => {
                setSelectedVehicle(vehicle.id);
                // Opcional: auto-preencher vagas com a capacidade do veículo
                setTotalSeats(String(vehicle.total_seats));
            }}
          >
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleModel}>{vehicle.model}</Text>
              <Text style={styles.vehiclePlate}>Placa: {vehicle.plate}</Text>
              <Text style={styles.vehicleSeats}>{vehicle.total_seats} assentos</Text>
            </View>
            {selectedVehicle === vehicle.id && (
              <View style={styles.selectedIndicator} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Criar Transfer</Text>
        <Text style={styles.subtitle}>Compartilhe sua viagem com outros transportistas</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Título do Transfer *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Congresso X - Aeroporto → Hotéis"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Origem *</Text>
            <View style={styles.inputWithIcon}>
              <MapPin size={20} color="#64748b" />
              <TextInput
                style={styles.inputText}
                value={origin}
                onChangeText={setOrigin}
                placeholder="Ponto de partida"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Destino *</Text>
            <View style={styles.inputWithIcon}>
              <MapPin size={20} color="#64748b" />
              <TextInput
                style={styles.inputText}
                value={destination}
                onChangeText={setDestination}
                placeholder="Ponto de chegada"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Data e Hora de Partida *</Text>
            <TouchableOpacity
              style={styles.inputWithIcon}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color="#64748b" />
              <Text style={styles.dateText}>
                {departureDate.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={departureDate}
              mode="datetime"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {renderVehicleSelector()}

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Vagas Disponíveis *</Text>
              <View style={styles.inputWithIcon}>
                <Users size={20} color="#64748b" />
                <TextInput
                  style={styles.inputText}
                  value={totalSeats}
                  onChangeText={setTotalSeats}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Preço por Vaga *</Text>
              <View style={styles.inputWithIcon}>
                <DollarSign size={20} color="#64748b" />
                <TextInput
                  style={styles.inputText}
                  value={pricePerSeat}
                  onChangeText={setPricePerSeat}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {isEnterprise && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Visibilidade</Text>
              <View style={styles.visibilityContainer}>
                <TouchableOpacity
                  style={[
                    styles.visibilityOption,
                    visibility === 'public' && styles.selectedVisibility
                  ]}
                  onPress={() => setVisibility('public')}
                >
                  <Text style={[
                    styles.visibilityText,
                    visibility === 'public' && styles.selectedVisibilityText
                  ]}>
                    Público
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.visibilityOption,
                    visibility === 'private' && styles.selectedVisibility
                  ]}
                  onPress={() => setVisibility('private')}
                >
                  <Text style={[
                    styles.visibilityText,
                    visibility === 'private' && styles.selectedVisibilityText
                  ]}>
                    Privado
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.createButton, loading && styles.disabledButton]}
            onPress={handleCreateTransfer}
            disabled={loading}
          >
            <Text style={styles.createButtonText}>
              {loading ? 'Criando...' : 'Criar Transfer'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  vehicleSelector: {
    marginBottom: 24,
  },
  vehicleOption: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedVehicle: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleModel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  vehiclePlate: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  vehicleSeats: {
    fontSize: 14,
    color: '#64748b',
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2563eb',
  },
  noVehiclesContainer: {
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  noVehiclesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 12,
    marginBottom: 8,
  },
  noVehiclesDescription: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  addVehicleButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addVehicleButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  visibilityContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
  },
  visibilityOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedVisibility: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  visibilityText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  selectedVisibilityText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});