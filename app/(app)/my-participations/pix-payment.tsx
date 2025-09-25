import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useStripe } from '@stripe/stripe-react-native';
import Toast from 'react-native-toast-message';
import * as Clipboard from 'expo-clipboard';

export default function PixPaymentScreen() {
  const router = useRouter();
  const { transferId, seatsRequested, totalPrice, passengers } = useLocalSearchParams();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  
  const [loading, setLoading] = useState(true);
  const [pixCode, setPixCode] = useState<string | null>(null);
  const [pixQrCodeUrl, setPixQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    const initializePayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('create-payment-intent', {
          body: {
            transferId: Number(transferId),
            seats: Number(seatsRequested),
            passengers: JSON.parse(passengers as string),
          },
        });

        if (error) throw error;
        const { clientSecret } = data;

        const { error: initError, paymentOption } = await initPaymentSheet({
          merchantDisplayName: 'VanConnect',
          paymentIntentClientSecret: clientSecret,
          defaultBillingDetails: {
            name: 'Cliente VanConnect',
          },
        });

        if (initError) throw initError;

        const { error: presentError, paymentOption: finalOption } = await presentPaymentSheet();
        
        if (presentError) {
          if (presentError.code !== 'Canceled') {
             Alert.alert('Erro no Pagamento', presentError.message);
          }
          router.back();
          return;
        }

        // Se chegar aqui, o webhook do Stripe cuidará do resto.
        Toast.show({
            type: 'success',
            text1: 'Pagamento em processamento!',
            text2: 'Você será notificado quando for confirmado.'
        });
        router.replace('/(app)/(tabs)/');

      } catch (e: any) {
        Alert.alert('Erro Crítico', e.message);
        router.back();
      }
    };

    initializePayment();
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#1e293b" />
        <Text style={styles.loadingText}>Processando seu pagamento...</Text>
        <Text style={styles.loadingSubText}>Por favor, aguarde.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  loadingSubText: {
    marginTop: 4,
    fontSize: 14,
    color: '#64748b',
  },
});
