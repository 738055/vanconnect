import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="transfer-details/[id]" />
      <Stack.Screen name="create-transfer" />
      <Stack.Screen name="subscription" />
    </Stack>
  );
}