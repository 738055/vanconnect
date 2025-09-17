import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Vehicle } from '../../../types/database';
import { useFocusEffect, useRouter } from 'expo-router';
import { Car, Plus } from 'lucide-react-native';

export default function MyVehiclesScreen() {
  const { profile } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchVehicles = async () => {
    if (!profile) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('owner_id', profile.id)
        .order('model', { ascending: true });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchVehicles();
    }, [profile])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Veículos</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(app)/vehicles/create')}>
          <Plus size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchVehicles} />}
      >
        {loading && vehicles.length === 0 ? (
          <ActivityIndicator size="large" style={{ marginTop: 50 }} />
        ) : vehicles.length > 0 ? (
          vehicles.map((vehicle) => (
            <TouchableOpacity 
              key={vehicle.id} 
              style={styles.vehicleCard}
              onPress={() => router.push(`/(app)/vehicles/${vehicle.id}`)} // Navega para editar
            >
              <Car size={32} color="#2563eb" />
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleModel}>{vehicle.model}</Text>
                <Text style={styles.vehicleDetails}>Placa: {vehicle.plate}</Text>
                <Text style={styles.vehicleDetails}>Capacidade: {vehicle.total_seats} assentos</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Car size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Nenhum veículo cadastrado</Text>
            <Text style={styles.emptyDescription}>Adicione seu primeiro veículo para começar a criar transfers.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// (Adicione os estilos abaixo)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 32, backgroundColor: '#ffffff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563eb', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, gap: 6 },
  addButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  scrollView: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  vehicleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 20, borderRadius: 16, marginBottom: 12, gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  vehicleInfo: { flex: 1 },
  vehicleModel: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  vehicleDetails: { fontSize: 14, color: '#64748b' },
  emptyState: { alignItems: 'center', paddingVertical: 64 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#64748b', marginTop: 16, marginBottom: 8 },
  emptyDescription: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
});