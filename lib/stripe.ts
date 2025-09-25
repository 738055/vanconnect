// Em: lib/stripe.ts

import { initStripe } from '@stripe/stripe-react-native';

let stripeInitialized = false;

export const initializeStripe = async () => {
  if (stripeInitialized) {
    return;
  }

  const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!stripePublishableKey) {
    console.warn("Stripe Publishable Key não encontrada. Os pagamentos não funcionarão.");
    stripeInitialized = true;
    return;
  }

  try {
    await initStripe({
      publishableKey: stripePublishableKey,
      merchantIdentifier: 'merchant.com.transferapp', // Apenas para iOS, altere se necessário
    });
    
    stripeInitialized = true;
    console.log("Stripe inicializado com sucesso.");
  } catch (error) {
    console.error("Erro ao inicializar o Stripe:", error);
  }
};