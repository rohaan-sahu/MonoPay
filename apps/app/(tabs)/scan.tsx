import { Pressable, Text, View, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

const displayFont = Platform.select({
  ios: "Bricolage Grotesque",
  android: "sans-serif-light",
  default: "sans-serif",
});

const bodyFont = Platform.select({
  ios: "Inter",
  android: "sans-serif",
  default: "sans-serif",
});

export default function PayScreen() {
  return (
    <SafeAreaView style={ps.page} edges={["top"]}>
      <View style={ps.content}>
        <Text style={ps.heading}>Pay</Text>
        <Text style={ps.subtitle}>Send crypto to anyone, instantly.</Text>
        <Pressable style={ps.sendButton} onPress={() => router.push("/send/amount")}>
          <Feather name="arrow-up-right" size={20} color="#fff" />
          <Text style={ps.sendButtonText}>Send Payment</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const ps = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#fdfdfd" },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  heading: {
    color: "#171717",
    fontSize: 32,
    letterSpacing: -0.8,
    fontWeight: "300",
    fontFamily: displayFont,
    marginBottom: 8,
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 15,
    fontFamily: bodyFont,
    marginBottom: 32,
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#111111",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: bodyFont,
  },
});
