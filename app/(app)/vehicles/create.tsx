import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';

export default function CreateVehicleScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [totalSeats, setTotalSeats] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateVehicle = async () => {
    if (!model.trim() || !plate.trim() || !totalSeats.trim()) {
      Alert.alert('Erro', 'Todos os campos são obrigatórios.');
      return;
    }
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('vehicles').insert({
        owner_id: profile.id,
        model: model.trim(),
        plate: plate.trim().toUpperCase(),
        total_seats: parseInt(totalSeats),
      });

      if (error) throw error;

      Alert.alert('Sucesso', 'Veículo cadastrado!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error) {
      console.error('Error creating vehicle:', error);
      Alert.alert('Erro', 'Não foi possível cadastrar o veículo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cadastrar Veículo</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Modelo do Veículo</Text>
        <TextInput style={styles.input} value={model} onChangeText={setModel} placeholder="Ex: Mercedes-Benz Sprinter" />

        <Text style={styles.label}>Placa</Text>
        <TextInput style={styles.input} value={plate} onChangeText={setPlate} placeholder="ABC-1234" autoCapitalize="characters" />
        
        <Text style={styles.label}>Capacidade de Passageiros</Text>
        <TextInput style={styles.input} value={totalSeats} onChangeText={setTotalSeats} placeholder="Ex: 15" keyboardType="numeric" />

        <TouchableOpacity style={[styles.saveButton, loading && styles.disabledButton]} onPress={handleCreateVehicle} disabled={loading}>
          <Text style={styles.saveButtonText}>{loading ? 'Salvando...' : 'Salvar Veículo'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// (Adicione os estilos abaixo)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 24, paddingVertical: 32, backgroundColor: '#ffffff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  form: { padding: 24 },
  label: { fontSize: 16, fontWeight: '500', color: '#374151', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  saveButton: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 32 },
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  disabledButton: { opacity: 0.6 },
});