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
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { Clipboard, CheckCircle } from 'lucide-react-native';

export default function PixPaymentScreen() {
  const { transferId, seatsRequested, totalPrice } = useLocalSearchParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = React.useState(false);
  
  // Garante que o preço seja formatado corretamente
  const formattedPrice = parseFloat(totalPrice as string).toFixed(2);
  const numericTransferId = Number(transferId);
  const numericSeatsRequested = Number(seatsRequested);

  // Função que simula a cópia do código Pix
  const handleCopyCode = () => {
    Alert.alert('Código Pix Copiado!', 'O código foi copiado para a sua área de transferência.');
  };

  /**
   * Função que simula a confirmação de pagamento "via banco".
   * Ela chama uma função no Supabase (RPC) que executa a lógica de forma segura:
   * 1. Verifica se há vagas disponíveis.
   * 2. Insere a participação com status 'approved'.
   * 3. Atualiza o número de vagas ocupadas no transfer.
   * Tudo isso em uma única transação no banco de dados.
   */
  const handleConfirmPayment = async () => {
    if (!profile || !numericTransferId) {
      Alert.alert('Erro', 'Dados de usuário ou do transfer não encontrados.');
      return;
    }
    
    setLoading(true);

    try {
      const { error } = await supabase.rpc('handle_successful_payment', {
        p_transfer_id: numericTransferId,
        p_participant_id: profile.id,
        p_seats_requested: numericSeatsRequested,
        p_total_price: parseFloat(formattedPrice)
      });

      if (error) {
        // Trata erros específicos retornados pela função do banco
        if (error.message.includes('INSUFFICIENT_SEATS')) {
            Alert.alert('Erro', 'Não há vagas suficientes disponíveis neste transfer.');
        } else if (error.message.includes('ALREADY_PARTICIPATING')) {
            Alert.alert('Atenção', 'Você já está participando deste transfer.');
        } else {
            throw new Error(error.message);
        }
      } else {
        // Sucesso!
        Alert.alert(
          'Pagamento Confirmado!', 
          'Sua reserva (simulada) foi concluída com sucesso. Você já pode ver os detalhes em "Minhas Participações".',
          [{ text: 'OK', onPress: () => router.push('/(app)/(tabs)/transfers') }]
        );
      }
    } catch (error: any) {
      console.error('Erro ao confirmar pagamento simulado:', error);
      Alert.alert('Erro', 'Ocorreu um problema ao registrar a sua reserva. Por favor, tente novamente.');
    } finally {
      setLoading(false);
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
          <Text style={styles.pixTitle}>Pagar com Pix (Simulação)</Text>
          <Image
            source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=simulacao' }} // QR Code genérico
            style={styles.qrCode}
          />
          <Text style={styles.qrLabel}>Escaneie o QR Code</Text>
          <Text style={styles.orText}>ou</Text>
          <Text style={styles.copyPasteCode}>
            <Text style={styles.copyPasteText}>chave_pix_simulada_copia_e_cola</Text>
          </Text>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
            <Clipboard size={18} color="#2563eb" />
            <Text style={styles.copyButtonText}>Copiar Código</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
            style={[styles.confirmButton, loading && styles.disabledButton]} 
            onPress={handleConfirmPayment}
            disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirmar Pagamento</Text>
          )}
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
  copyPasteText: { fontSize: 14, color: '#1e293b', fontWeight: '500' },
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
  disabledButton: {
    opacity: 0.7,
  }
});