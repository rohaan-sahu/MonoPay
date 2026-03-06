import { Stack } from "expo-router";
import '@/lib/polyfills';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
