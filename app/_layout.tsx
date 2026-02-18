import { Stack } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <Stack screenOptions={{ headerShown: false }} >
                <Stack.Screen name="(tabs)"/>
                <Stack.Screen name="token/[mint]"/>
            </Stack>
        </SafeAreaProvider>
    )
}