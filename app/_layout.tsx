import { Stack } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import TestScreen from "./test";
import '@/lib/polyfills';
import { AuthProvider } from "@/stores/local-auth-stores";

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <Stack screenOptions={{ headerShown: false }} >
                    <Stack.Screen name="(tabs)"/>
                    <Stack.Screen name="test"
                        options={{
                            presentation: "modal",
                        }}
                    />
                    <Stack.Screen name="scan"
                        options={{
                            presentation: "modal",
                        }}
                    />
                    <TestScreen/>
                </Stack>
            </AuthProvider>
        </SafeAreaProvider>
    )
}