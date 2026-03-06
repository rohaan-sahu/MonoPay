import { Redirect,router } from "expo-router";
import { useMemo,useEffect, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Clipboard from '@react-native-clipboard/clipboard';

import { DismissKeyboard } from "@/components/DismissKeyboard";
import { useAuthStore } from "@/stores/local-auth-stores";
import { cheksAuthScreen as s } from "@/styles/screenAuth";
import { authWalletImportStyles as styles } from "@/styles/screenAuth";
import { walletService } from "@/services/walletService";
import { web3AuthService } from "@/services/web3AuthServices";
import { identityProvisioningService } from "@/services/identityProvisioningService";


type ParserMode = "auto" | "private" | "mnemonic";

const DEFAULT_DERIVATION_PATH = "m/44'/501'/0'/0'";

export default function WalletImportScreen() {
  const { currentUser, linkWalletToUser } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<ParserMode>("auto");
  const [rawInput, setRawInput] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [derivationPath, setDerivationPath] = useState(DEFAULT_DERIVATION_PATH);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const isMnemonicMode = mode === "mnemonic";
  const inputLabel = useMemo(() => {
    if (mode === "mnemonic") {
      return "Mnemonic phrase";
    }

    if (mode === "private") {
      return "Private key";
    }

    return "Wallet key or mnemonic";
  }, [mode]);

  if (!currentUser) {
    return <Redirect href="/(auth)/welcome" />;
  }

  const handleImport = async () => {
    setError("");
    setInfo("");
    setIsLoading(true);

    try {
      const imported = await walletService.parseAndImportWallet(rawInput, {
        forceMnemonic: mode === "mnemonic",
        derivationPath: isMnemonicMode ? derivationPath : undefined,
        passphrase: isMnemonicMode ? passphrase : undefined,
      });

      const web3Auth = await web3AuthService.signInWithEmbeddedWallet();

      if (web3Auth.walletAddress !== imported.wallet.publicKey) {
        throw new Error("Wallet mismatch after Web3 authentication.");
      }

      const identity = await identityProvisioningService.ensureIdentityForWallet({
        walletAddress: imported.wallet.publicKey,
        ownerUserId: web3Auth.userId,
        displayName: currentUser.fullName,
        phone: currentUser.phone,
        email: currentUser.email,
        preferredTag: currentUser.monopayTag || currentUser.handle,
        existingMonopayTag: currentUser.monopayTag,
        existingMetaplexCardId: currentUser.metaplexCardId,
        existingMetaplexCardStatus: currentUser.metaplexCardStatus,
        existingMetaplexNetwork: currentUser.metaplexNetwork,
      });

      const linked = linkWalletToUser(imported.wallet.publicKey, {
        supabaseUserId: web3Auth.userId,
        monopayTag: identity.monopayTag,
        metaplexCardId: identity.metaplexCardId,
        metaplexCardStatus: identity.metaplexCardStatus,
        metaplexNetwork: identity.metaplexNetwork,
        metaplexSyncStatus: identity.metaplexSyncStatus,
        metaplexLastSyncAt: identity.metaplexLastSyncAt,
        metaplexLastTxSignature: identity.metaplexLastTxSignature,
      });

      if (!linked.ok) {
        throw new Error(linked.error || "Failed to link imported wallet.");
      }

      setInfo(
        imported.derivationPath
          ? `Imported from ${imported.source} using ${imported.derivationPath}`
          : `Imported from ${imported.source}`
      );
      router.replace("/(auth)/setupPasscode");
    } catch (importError) {
      const message = importError instanceof Error ? importError.message : "Wallet import failed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.page} edges={["top"]}>
      <DismissKeyboard>
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

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={s.headingWrap}>
                <Text style={s.heading}>
                  Import <Text style={s.headingMuted}>wallet</Text>
                </Text>
              </View>

              <Text style={s.helperText}>
                Paste your existing private key or mnemonic phrase. Your key stays on device and is used to sign Web3 auth for MonoPay.
              </Text>

              <View style={styles.modeRow}>
                {(["auto", "private", "mnemonic"] as ParserMode[]).map((item) => (
                  <Pressable
                    key={item}
                    style={[styles.modeChip, mode === item && styles.modeChipActive]}
                    onPress={() => {
                      setMode(item);
                      setError("");
                    }}
                  >
                    <Text style={[styles.modeChipText, mode === item && styles.modeChipTextActive]}>
                      {item === "auto" ? "Auto" : item === "private" ? "Private Key" : "Mnemonic"}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={s.card}>
                <View style={s.cardHeader}>
                  <View style={s.cardIconWrap}>
                    <Feather name="key" size={20} color="#525252" />
                  </View>
                  <View>
                    <Text style={s.cardTitle}>{inputLabel}</Text>
                    <Text style={s.cardSubtitle}>
                      Supports byte array, hex, base58, or 12/24-word phrase.
                    </Text>
                  </View>
                </View>

                <TextInput
                  style={styles.multilineInput}
                  value={rawInput}
                  onChangeText={(value) => {
                    setRawInput(value);
                    setError("");
                  }}
                  placeholder={mode === "mnemonic" ? "seed words..." : "paste private key or phrase"}
                  placeholderTextColor="#a3a3a3"
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline
                />

                {isMnemonicMode ? (
                  <>
                    <TextInput
                      style={[s.input, s.inputGap]}
                      value={passphrase}
                      onChangeText={setPassphrase}
                      placeholder="Passphrase (optional)"
                      placeholderTextColor="#a3a3a3"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TextInput
                      style={s.input}
                      value={derivationPath}
                      onChangeText={setDerivationPath}
                      placeholder={DEFAULT_DERIVATION_PATH}
                      placeholderTextColor="#a3a3a3"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </>
                ) : null}

                {!!error ? (
                  <View style={s.errorBox}>
                    <Text style={s.errorText}>{error}</Text>
                  </View>
                ) : null}

                {!!info ? (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoText}>{info}</Text>
                  </View>
                ) : null}
              </View>
            </ScrollView>
          </View>

          <View style={[s.footerShell, { paddingBottom: Math.max(insets.bottom, 8) }]}>
            <View style={s.footer}>
              <View>
                <Text style={s.footerLabel}>secure setup</Text>
                <Text style={s.footerTitle}>Import</Text>
              </View>
              <Pressable style={[s.ctaButton, isLoading && s.ctaButtonDisabled]} onPress={handleImport} disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#171717" />
                ) : (
                  <Feather name="arrow-right" size={24} color="#171717" />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </DismissKeyboard>
    </SafeAreaView>
  );
}