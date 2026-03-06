import { Redirect,router } from "expo-router";
import { useMemo,useEffect, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Clipboard from '@react-native-clipboard/clipboard';

import { DismissKeyboard } from "@/components/DismissKeyboard";
import { useAuthStore } from "@/stores/local-auth-stores";
import { cheksAuthScreen as s } from "@/styles/screenAuth";
import { authWalletExportStyles as styles } from "@/styles/screenAuth";
import { walletService } from "@/services/walletService";


export default function WalletExportScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [secretKeyBytes, setSecretKeyBytes] = useState<number[] | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

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
