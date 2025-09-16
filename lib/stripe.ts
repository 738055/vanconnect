import { initStripe } from '@stripe/stripe-react-native';

const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!;

export const initializeStripe = async () => {
  await initStripe({
    publishableKey: stripePublishableKey,
    merchantIdentifier: 'merchant.com.transferapp',
  });
};