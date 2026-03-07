import { Redirect, router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Clipboard, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { walletService } from "@mpay/services/wallet-service";
import { useAuthStore } from "@mpay/stores/auth-store";
import { cheksAuthScreen as s } from "@mpay/styles/cheksAuthScreen";

const PIN_LENGTH = 4;

const pinBodyFont = Platform.select({
  ios: "Inter",
  android: "sans-serif",
  default: "sans-serif",
});

const pinDisplayFont = Platform.select({
  ios: "Bricolage Grotesque",
  android: "sans-serif-light",
  default: "sans-serif",
});

export default function WalletExportScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, unlock } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [pinError, setPinError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [secretKeyBytes, setSecretKeyBytes] = useState<number[] | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const handlePinPress = useCallback(
    (digit: string) => {
      if (pinCode.length >= PIN_LENGTH) return;
      setPinError("");
      const next = pinCode + digit;
      setPinCode(next);

      if (next.length === PIN_LENGTH) {
        setTimeout(() => {
          const result = unlock(next);
          if (!result.ok) {
            setPinError(result.error ?? "Incorrect passcode.");
            setPinCode("");
            return;
          }
          setIsAuthorized(true);
        }, 150);
      }
    },
    [pinCode, unlock]
  );

  const handlePinDelete = useCallback(() => {
    setPinError("");
    setPinCode((p) => p.slice(0, -1));
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSecret = async () => {
      try {
        const bytes = await walletService.exportSecretKeyBytes();
        if (!isMounted) return;
        setSecretKeyBytes(bytes);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSecret();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!currentUser) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // ── PASSCODE GATE ──
  if (!isAuthorized) {
    return (
      <SafeAreaView style={pin.page}>
        <View style={pin.container}>
          <View style={pin.topSection}>
            <Pressable style={pin.backButton} onPress={() => router.back()}>
              <Feather name="arrow-left" size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>

            <View style={pin.lockIcon}>
              <Feather name="shield" size={22} color="#fff" />
            </View>

            <Text style={pin.title}>Verify Identity</Text>
            <Text style={pin.subtitle}>Enter your passcode to access your wallet key</Text>
          </View>

          <View style={pin.pinRow}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <View key={i} style={[pin.pinBox, i < pinCode.length && pin.pinBoxFilled]}>
                {i < pinCode.length && <View style={pin.pinDot} />}
              </View>
            ))}
          </View>

          {!!pinError && <Text style={pin.error}>{pinError}</Text>}

          <View style={{ flex: 1 }} />

          <View style={pin.numpad}>
            {[
              ["1", "2", "3"],
              ["4", "5", "6"],
              ["7", "8", "9"],
              ["", "0", "del"],
            ].map((row, ri) => (
              <View key={ri} style={pin.numpadRow}>
                {row.map((key, ki) => {
                  if (key === "") return <View key={ki} style={pin.numpadKey} />;
                  if (key === "del") {
                    return (
                      <Pressable key={ki} style={pin.numpadKey} onPress={handlePinDelete}>
                        <Feather name="delete" size={24} color="rgba(255,255,255,0.6)" />
                      </Pressable>
                    );
                  }
                  return (
                    <Pressable key={ki} style={pin.numpadKey} onPress={() => handlePinPress(key)}>
                      <Text style={pin.numpadDigit}>{key}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={pin.footer}>
            <Text style={pin.footerText}>
              <Text style={pin.footerLink} onPress={() => router.back()}>
                Cancel
              </Text>
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const secretKeyValue = secretKeyBytes ? JSON.stringify(secretKeyBytes) : "";

  const handleCopyKey = () => {
    if (!secretKeyValue) {
      setError("No wallet key found on this device.");
      return;
    }

    Clipboard.setString(secretKeyValue);
    setCopyStatus("Secret key copied to clipboard.");
    setError("");
  };

  const handleConfirm = async () => {
    setError("");

    if (!secretKeyBytes) {
      setError("No wallet key found on this device.");
      return;
    }

    if (!acknowledged) {
      setError("Confirm that you saved your wallet secret key.");
      return;
    }

    setIsSaving(true);

    try {
      await walletService.markRecoveryBackedUp();
      router.back();
    } catch (confirmError) {
      const message = confirmError instanceof Error ? confirmError.message : "Could not update backup status.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.page} edges={["top"]}>
      <View style={s.root}>
        <View style={[s.orb, s.orbTop]} />
        <View style={[s.orb, s.orbBottom]} />

        <View style={s.content}>
          <View style={s.headerRow}>
            <Pressable style={s.iconButton} onPress={() => router.back()}>
              <Feather name="arrow-left" size={20} color="#525252" />
            </Pressable>
            <View style={{ width: 48 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={s.headingWrap}>
              <Text style={s.heading}>
                Export <Text style={s.headingMuted}>wallet key</Text>
              </Text>
            </View>

            <Text style={s.helperText}>
              This wallet has no recovery phrase on device. Save this secret key now so you can restore the wallet later.
            </Text>

            <View style={s.card}>
              <View style={s.cardHeader}>
                <View style={s.cardIconWrap}>
                  <Feather name="alert-triangle" size={20} color="#dc2626" />
                </View>
                <View>
                  <Text style={s.cardTitle}>Highly sensitive</Text>
                  <Text style={s.cardSubtitle}>Never share this key with anyone.</Text>
                </View>
              </View>

              {isLoading ? (
                <View style={styles.loadingState}>
                  <ActivityIndicator size="small" color="#171717" />
                </View>
              ) : (
                <View style={styles.secretWrap}>
                  <Text selectable style={styles.secretText}>
                    {secretKeyValue || "No key available."}
                  </Text>
                </View>
              )}

              {!isLoading && (
                <Pressable style={styles.actionButton} onPress={handleCopyKey}>
                  <Feather name="copy" size={16} color="#171717" />
                  <Text style={styles.actionButtonText}>Copy secret key</Text>
                </Pressable>
              )}

              {!!copyStatus ? <Text style={styles.copyStatus}>{copyStatus}</Text> : null}

              <Pressable
                style={styles.checkboxRow}
                onPress={() => {
                  setAcknowledged((value) => !value);
                  setError("");
                }}
              >
                <View style={[styles.checkbox, acknowledged && styles.checkboxActive]}>
                  {acknowledged ? <Feather name="check" size={14} color="#fff" /> : null}
                </View>
                <Text style={styles.checkboxLabel}>I saved this secret key in a secure offline location.</Text>
              </Pressable>

              {!!error ? (
                <View style={s.errorBox}>
                  <Text style={s.errorText}>{error}</Text>
                </View>
              ) : null}
            </View>
          </ScrollView>
        </View>

        <View style={[s.footerShell, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <View style={s.footer}>
            <View>
              <Text style={s.footerLabel}>legacy wallet</Text>
              <Text style={s.footerTitle}>Confirm</Text>
            </View>

            <Pressable style={[s.ctaButton, isSaving && s.ctaButtonDisabled]} onPress={handleConfirm} disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator size="small" color="#171717" />
              ) : (
                <Feather name="arrow-right" size={24} color="#171717" />
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingState: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  secretWrap: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  secretText: {
    color: "#171717",
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Courier",
  },
  actionButton: {
    marginBottom: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionButtonText: {
    color: "#171717",
    fontSize: 13,
    fontWeight: "600",
  },
  copyStatus: {
    color: "#525252",
    fontSize: 12,
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#d4d4d4",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxActive: {
    borderColor: "#171717",
    backgroundColor: "#171717",
  },
  checkboxLabel: {
    flex: 1,
    color: "#404040",
    fontSize: 13,
    lineHeight: 18,
  },
});

const pin = StyleSheet.create({
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
    fontFamily: pinDisplayFont,
    marginBottom: 8,
  },
  subtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontFamily: pinBodyFont,
    textAlign: "center",
    paddingHorizontal: 20,
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
    fontFamily: pinBodyFont,
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
    fontFamily: pinBodyFont,
  },
  footer: {
    paddingBottom: 20,
    alignItems: "center",
  },
  footerText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontFamily: pinBodyFont,
  },
  footerLink: {
    color: "#ffffff",
    fontWeight: "700",
    fontFamily: pinBodyFont,
  },
});
