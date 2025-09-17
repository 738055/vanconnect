import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { Clipboard, CheckCircle } from 'lucide-react-native';

export default function PixPaymentScreen() {
  const { transferId, seatsRequested, totalPrice } = useLocalSearchParams();
  const router = useRouter();
  const { profile } = useAuth();
  
  const formattedPrice = parseFloat(totalPrice as string).toFixed(2);
  
  // Função que simula a cópia do código Pix (opcional)
  const handleCopyCode = () => {
    // Implemente a lógica de copiar para a área de transferência aqui
    Alert.alert('Código Pix Copiado!', 'O código foi copiado para a sua área de transferência.');
  };

  // Função para simular o pagamento e registrar a participação
  const handleConfirmPayment = async () => {
    if (!profile || !transferId) {
      Alert.alert('Erro', 'Dados de usuário ou do transfer não encontrados.');
      return;
    }

    try {
      // 1. Inserir a participação na tabela transfer_participations
      const { error: participationError } = await supabase
        .from('transfer_participations')
        .insert({
          transfer_id: transferId,
          participant_id: profile.id,
          seats_requested: seatsRequested,
          total_price: formattedPrice,
          status: 'pending', // O status pode ser 'pending' até o motorista aprovar
        });

      if (participationError) {
        if (participationError.code === '23505') { // Código de erro para violação de unique constraint
          Alert.alert('Atenção', 'Você já solicitou participação neste transfer!');
        } else {
          throw participationError;
        }
      }

      // 2. Atualizar o número de vagas ocupadas no transfer
      // O Supabase tem uma função integrada que pode ser usada aqui, mas faremos manualmente para simplicidade
      const { data: currentTransfer, error: fetchError } = await supabase
        .from('transfers')
        .select('occupied_seats')
        .eq('id', transferId)
        .single();
      
      if (fetchError) throw fetchError;

      const newOccupiedSeats = currentTransfer.occupied_seats + parseInt(seatsRequested as string);
      
      const { error: updateError } = await supabase
        .from('transfers')
        .update({ occupied_seats: newOccupiedSeats })
        .eq('id', transferId);
      
      if (updateError) throw updateError;
      
      // Sucesso!
      Alert.alert('Pagamento Confirmado!', 'Sua reserva foi concluída com sucesso. Um motorista irá aprovar a sua solicitação em breve.');
      
      // Redirecionar para a tela inicial ou para a tela de participações
      router.push('/(app)/(tabs)/transfers');

    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      Alert.alert('Erro', 'Ocorreu um problema ao registrar a sua reserva. Por favor, tente novamente.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <CheckCircle size={48} color="#10b981" />
          <Text style={styles.headerTitle}>Reserva de Vagas</Text>
          <Text style={styles.headerSubtitle}>Para completar a reserva, realize o pagamento via Pix.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalhes do Pagamento</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Valor:</Text>
            <Text style={styles.detailValue}>R$ {formattedPrice}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vagas reservadas:</Text>
            <Text style={styles.detailValue}>{seatsRequested}</Text>
          </View>
        </View>

        <View style={styles.pixCard}>
          <Text style={styles.pixTitle}>Pagar com Pix</Text>
          <Image
            source={{ uri: 'https://via.placeholder.com/200' }} // Substitua pela sua URL de QR Code Pix
            style={styles.qrCode}
          />
          <Text style={styles.qrLabel}>Escaneie o QR Code</Text>
          <Text style={styles.orText}>ou</Text>
          <Text style={styles.copyPasteCode}>
            <Text style={styles.copyPasteText}>Código Pix (Copia e Cola)</Text>
          </Text>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
            <Clipboard size={18} color="#2563eb" />
            <Text style={styles.copyButtonText}>Copiar Código</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmPayment}>
          <Text style={styles.confirmButtonText}>Confirmar Pagamento</Text>
        </TouchableOpacity>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 24, alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 24, paddingHorizontal: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1e293b', marginTop: 12, textAlign: 'center' },
  headerSubtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 8 },
  card: {
    backgroundColor: '#ffffff',
    width: '100%',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  detailLabel: { fontSize: 16, color: '#475569' },
  detailValue: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  pixCard: {
    backgroundColor: '#ffffff',
    width: '100%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  pixTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  qrCode: { width: 200, height: 200, resizeMode: 'contain', marginBottom: 12 },
  qrLabel: { fontSize: 14, color: '#64748b' },
  orText: { fontSize: 14, color: '#94a3b8', marginVertical: 8 },
  copyPasteCode: {
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    textAlign: 'center',
  },
  copyPasteText: { fontSize: 16, color: '#1e293b', fontWeight: '500' },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
  copyButtonText: { fontSize: 16, color: '#2563eb', fontWeight: '600' },
  confirmButton: {
    backgroundColor: '#10b981',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
});