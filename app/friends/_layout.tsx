import { Stack } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function FriendsLayout() {
    return (
        <SafeAreaProvider>
            <Stack screenOptions={{ headerShown: false }} >
                <Stack.Screen name="index"/>
                <Stack.Screen name="[friend]"/>
            </Stack>
        </SafeAreaProvider>
    )
}
