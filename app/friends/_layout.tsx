import "react-native-get-random-values";
import { Buffer } from "buffer";
import { Stack } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

//import "@/lib/polyfills";

global.Buffer = global.Buffer || Buffer;

export default function FriendsLayout() {
    return (
        <SafeAreaProvider>
            <Stack screenOptions={{ headerShown: false }} >
                <Stack.Screen name="index"/>
                <Stack.Screen name="[friends]"/>
                <Stack.Screen
                    name="tokenAccounts"
                    options={{
                    presentation: "modal",  // slides up from bottom like a sheet
                    }}
                />
            </Stack>
        </SafeAreaProvider>
    )
}
