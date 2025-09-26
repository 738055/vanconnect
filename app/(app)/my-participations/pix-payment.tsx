import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as Clipboard from 'expo-clipboard';
import { Copy, CheckCircle } from 'lucide-react-native';

export default function PixPaymentScreen() {
  const router = useRouter();
  const { pixQrCodeUrl, pixCode, totalPrice } = useLocalSearchParams();
  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = async () => {
    if (pixCode && typeof pixCode === 'string') {
      await Clipboard.setStringAsync(pixCode);
      setCopied(true);
      Toast.show({
        type: 'success',
        text1: 'Código PIX Copiado!',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConclude = () => {
    Toast.show({
      type: 'info',
      text1: 'Aguardando Confirmação',
      text2: 'Você será notificado assim que o pagamento for confirmado.',
    });
    router.replace('/(app)/my-participations');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Pague com PIX</Text>
        <Text style={styles.amountLabel}>Valor a pagar:</Text>
        <Text style={styles.amountValue}>R$ {Number(totalPrice).toFixed(2)}</Text>
        
        {pixQrCodeUrl ? (
          <Image source={{ uri: pixQrCodeUrl as string }} style={styles.qrCode} />
        ) : (
          <ActivityIndicator size="large" color="#1e293b" />
        )}
        
        <Text style={styles.instructions}>Use o app do seu banco para ler o QR Code ou copie o código abaixo.</Text>

        <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
          {copied ? <CheckCircle size={20} color="#10b981" /> : <Copy size={20} color="#2563eb" />}
          <Text style={styles.copyButtonText}>{copied ? 'Copiado!' : 'Copiar Código PIX'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.concludeButton} onPress={handleConclude}>
          <Text style={styles.concludeButtonText}>Já paguei, concluir</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', padding: 24 },
  content: { backgroundColor: '#ffffff', borderRadius: 16, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  amountLabel: { fontSize: 16, color: '#64748b' },
  amountValue: { fontSize: 28, fontWeight: 'bold', color: '#10b981', marginBottom: 24 },
  qrCode: { width: 250, height: 250, marginBottom: 24, borderWidth: 1, borderColor: '#e5e7eb' },
  instructions: { fontSize: 14, color: '#475569', textAlign: 'center', marginBottom: 24 },
  copyButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff', paddingVertical: 14, borderRadius: 12, width: '100%', gap: 8, marginBottom: 12 },
  copyButtonText: { color: '#2563eb', fontSize: 16, fontWeight: '600' },
  concludeButton: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  concludeButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});