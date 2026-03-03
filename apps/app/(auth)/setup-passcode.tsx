import { Redirect, router } from "expo-router";
import { useCallback, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@mpay/stores/auth-store";
import { cheksAuthScreen as s } from "@mpay/styles/cheksAuthScreen";

const PIN_LENGTH = 4;

export default function SetupPasscodeScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, setPasscode: savePasscode } = useAuthStore();
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [passcode, setPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [error, setError] = useState("");

  const currentCode = step === "create" ? passcode : confirmPasscode;
  const setCurrentCode = step === "create" ? setPasscode : setConfirmPasscode;

  const handlePress = useCallback(
    (digit: string) => {
      if (currentCode.length >= PIN_LENGTH) return;
      setError("");
      const next = currentCode + digit;
      setCurrentCode(next);

      if (next.length === PIN_LENGTH) {
        if (step === "create") {
          setTimeout(() => setStep("confirm"), 200);
        } else {
          setTimeout(() => {
            if (next !== passcode) {
              setError("Passcodes do not match.");
              setConfirmPasscode("");
              return;
            }
            const result = savePasscode(next);
            if (!result.ok) {
              setError(result.error ?? "Unable to save passcode.");
              setConfirmPasscode("");
              return;
            }
            router.replace("/lock");
          }, 200);
        }
      }
    },
    [currentCode, step, passcode, savePasscode, setCurrentCode]
  );

  const handleDelete = useCallback(() => {
    setError("");
    setCurrentCode(currentCode.slice(0, -1));
  }, [currentCode, setCurrentCode]);

  const handleBack = () => {
    if (step === "confirm") {
      setStep("create");
      setConfirmPasscode("");
      setError("");
    } else {
      router.back();
    }
  };

  if (!currentUser) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <SafeAreaView style={s.page} edges={["top"]}>
      <View style={s.root}>
        <View style={[s.orb, s.orbTop]} />
        <View style={[s.orb, s.orbBottom]} />

        <View style={s.content}>
          {/* Header */}
          <View style={s.headerRow}>
            <Pressable style={s.iconButton} onPress={handleBack}>
              <Feather name="arrow-left" size={20} color="#525252" />
            </Pressable>
            <View style={{ width: 48 }} />
          </View>

          {/* Heading */}
          <View style={s.headingWrap}>
            <Text style={s.heading}>
              {step === "create" ? "Secure your " : "Confirm your "}
              <Text style={s.headingMuted}>
                {step === "create" ? "wallet" : "passcode"}
              </Text>
            </Text>
            <Text style={[s.cardSubtitle, { marginTop: 10, fontSize: 14 }]}>
              {step === "create"
                ? "Set a 6-digit passcode to unlock MonoPay."
                : "Re-enter your passcode to confirm."}
            </Text>
          </View>

          {/* PIN Dots */}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 14, marginBottom: 8 }}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: 48,
                  height: 52,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: i < currentCode.length ? "#171717" : "#e5e5e5",
                  backgroundColor: i < currentCode.length ? "#171717" : "#fafafa",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {i < currentCode.length && (
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#fff" }} />
                )}
              </View>
            ))}
          </View>

          {!!error && (
            <Text style={{ color: "#dc2626", fontSize: 13, textAlign: "center", marginTop: 8 }}>
              {error}
            </Text>
          )}

          {/* Numpad */}
          <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 16 }}>
            {[["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["", "0", "del"]].map((row, ri) => (
              <View key={ri} style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 20 }}>
                {row.map((key, ki) => {
                  if (key === "") {
                    return <View key={ki} style={{ width: 72, height: 72 }} />;
                  }
                  if (key === "del") {
                    return (
                      <Pressable
                        key={ki}
                        onPress={handleDelete}
                        style={{ width: 72, height: 72, alignItems: "center", justifyContent: "center" }}
                      >
                        <Feather name="delete" size={24} color="#171717" />
                      </Pressable>
                    );
                  }
                  return (
                    <Pressable
                      key={ki}
                      onPress={() => handlePress(key)}
                      style={{ width: 72, height: 72, alignItems: "center", justifyContent: "center" }}
                    >
                      <Text style={{ fontSize: 28, fontWeight: "600", color: "#171717" }}>{key}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={[s.footerShell, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <View style={s.footer}>
            <View>
              <Text style={s.footerLabel}>next</Text>
              <Text style={s.footerTitle}>Save Passcode</Text>
            </View>
            <Pressable
              style={[s.ctaButton, currentCode.length !== PIN_LENGTH && s.ctaButtonDisabled]}
              onPress={() => {
                if (step === "create" && passcode.length === PIN_LENGTH) {
                  setStep("confirm");
                }
              }}
              disabled={currentCode.length !== PIN_LENGTH}
            >
              <Feather name="arrow-right" size={24} color="#171717" />
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
