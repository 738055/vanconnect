import { initStripe } from '@stripe/stripe-react-native';

// 1. Variável para controlar se a inicialização já ocorreu.
let stripeInitialized = false;

export const initializeStripe = async () => {
  // 2. Se já foi inicializado, não faz nada.
  if (stripeInitialized) {
    return;
  }

  const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  // 3. Se a chave não existir ou estiver vazia, avisa no console e não faz nada.
  if (!stripePublishableKey) {
    console.log("Stripe Publishable Key não encontrada, a pular a inicialização. (Modo Mock)");
    stripeInitialized = true; // Marca como 'inicializado' para não tentar de novo.
    return;
  }

  // Se a chave existir, inicializa o Stripe.
  try {
    await initStripe({
      publishableKey: stripePublishableKey,
      merchantIdentifier: 'merchant.com.transferapp', // Apenas para iOS
    });
    
    // 4. Marca como inicializado após o sucesso.
    stripeInitialized = true;
    console.log("Stripe inicializado com sucesso.");
  } catch (error) {
    console.error("Erro ao inicializar o Stripe:", error);
  }
};