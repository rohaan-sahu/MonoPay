import { Stack } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import TestScreen from "./test";
import '@/lib/polyfills';

export default function RootLayout() {
    return (
        <SafeAreaProvider>
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
        </SafeAreaProvider>
    )
}