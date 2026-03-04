import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuthStore } from "@mpay/stores/auth-store";

const PIN_LENGTH = 4;

const bodyFont = Platform.select({
  ios: "Inter",
  android: "sans-serif",
  default: "sans-serif",
});

const displayFont = Platform.select({
  ios: "Bricolage Grotesque",
  android: "sans-serif-light",
  default: "sans-serif",
});

export default function AuthorizeScreen() {
  const { currentUser, unlock } = useAuthStore();
  const params = useLocalSearchParams<{
    amount: string;
    currency: string;
    memo: string;
    isStable: string;
    recipient: string;
    recipientName: string;
  }>();

  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");

  const symbol = params.isStable === "1" ? "$" : "◎";

  const handlePress = useCallback(
    (digit: string) => {
      if (passcode.length >= PIN_LENGTH) return;
      setError("");
      const next = passcode + digit;
      setPasscode(next);

      if (next.length === PIN_LENGTH) {
        setTimeout(() => {
          const result = unlock(next);
          if (!result.ok) {
            setError(result.error ?? "Incorrect passcode.");
            setPasscode("");
            return;
          }

          // Passcode correct — go back to confirm with authorized flag
          router.replace({
            pathname: "/send/confirm",
            params: {
              amount: params.amount,
              currency: params.currency,
              memo: params.memo,
              isStable: params.isStable,
              recipient: params.recipient,
              recipientName: params.recipientName,
              authorized: "1",
            },
          });
        }, 150);
      }
    },
    [passcode, unlock, params]
  );

  const handleDelete = useCallback(() => {
    setError("");
    setPasscode((p) => p.slice(0, -1));
  }, []);

  const recipientDisplay = params.recipientName || params.recipient || "";

  return (
    <SafeAreaView style={as.page}>
      <View style={as.container}>
        {/* Header */}
        <View style={as.topSection}>
          <Pressable style={as.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color="rgba(255,255,255,0.7)" />
          </Pressable>

          <View style={as.lockIcon}>
            <Feather name="lock" size={22} color="#fff" />
          </View>

          <Text style={as.title}>Authorize Payment</Text>
          <Text style={as.subtitle}>
            {symbol}
            {Number.parseFloat(params.amount || "0").toLocaleString("en-US")} {params.currency}
            {recipientDisplay ? ` to ${recipientDisplay}` : ""}
          </Text>
          <Text style={as.instruction}>Enter your {PIN_LENGTH}-digit passcode</Text>
        </View>

        {/* PIN indicators */}
        <View style={as.pinRow}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[as.pinBox, i < passcode.length && as.pinBoxFilled]}
            >
              {i < passcode.length && <View style={as.pinDot} />}
            </View>
          ))}
        </View>

        {!!error && <Text style={as.error}>{error}</Text>}

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Numpad */}
        <View style={as.numpad}>
          {[
            ["1", "2", "3"],
            ["4", "5", "6"],
            ["7", "8", "9"],
            ["", "0", "del"],
          ].map((row, ri) => (
            <View key={ri} style={as.numpadRow}>
              {row.map((key, ki) => {
                if (key === "") {
                  return <View key={ki} style={as.numpadKey} />;
                }
                if (key === "del") {
                  return (
                    <Pressable key={ki} style={as.numpadKey} onPress={handleDelete}>
                      <Feather name="delete" size={24} color="rgba(255,255,255,0.6)" />
                    </Pressable>
                  );
                }
                return (
                  <Pressable key={ki} style={as.numpadKey} onPress={() => handlePress(key)}>
                    <Text style={as.numpadDigit}>{key}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <View style={as.footer}>
          <Text style={as.footerText}>
            Forgot passcode?{" "}
            <Text style={as.footerLink} onPress={() => router.back()}>
              Cancel
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const as = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#111111",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  topSection: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 32,
  },
  backButton: {
    alignSelf: "flex-start",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  lockIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
    fontFamily: displayFont,
    marginBottom: 8,
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
    fontFamily: bodyFont,
    textAlign: "center",
    marginBottom: 4,
  },
  instruction: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontFamily: bodyFont,
    marginTop: 4,
  },
  pinRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
  },
  pinBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  pinBoxFilled: {
    borderColor: "#ffffff",
    backgroundColor: "#ffffff",
  },
  pinDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#111111",
  },
  error: {
    color: "#f87171",
    fontSize: 13,
    textAlign: "center",
    marginTop: 12,
    fontFamily: bodyFont,
  },
  numpad: {
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  numpadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  numpadKey: {
    width: 80,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  numpadDigit: {
    fontSize: 28,
    fontWeight: "600",
    color: "#ffffff",
    fontFamily: bodyFont,
  },
  footer: {
    paddingBottom: 20,
    alignItems: "center",
  },
  footerText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontFamily: bodyFont,
  },
  footerLink: {
    color: "#ffffff",
    fontWeight: "700",
    fontFamily: bodyFont,
  },
});
