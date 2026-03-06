import { Redirect,router } from "expo-router";
import { useMemo,useEffect, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
//import Clipboard from '@react-native-clipboard/clipboard';
import * as Clipboard from 'expo-clipboard';

import { DismissKeyboard } from "@/components/DismissKeyboard";
import { useAuthStore } from "@/stores/local-auth-stores";
import { cheksAuthScreen as s } from "@/styles/screenAuth";
import { authWalletBackupStyles as styles } from "@/styles/screenAuth";
import { walletService } from "@/services/walletService";


export default function WalletBackupScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuthStore();
  const [phrase, setPhrase] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [checkWord, setCheckWord] = useState("");
  const [hasSavedPhrase, setHasSavedPhrase] = useState(false);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const words = useMemo(
    () =>
      phrase
        .trim()
        .split(/\s+/g)
        .filter(Boolean),
    [phrase]
  );
  const phraseValue = useMemo(() => words.join(" "), [words]);
  const verificationIndex = useMemo(() => (words.length ? Math.min(4, words.length - 1) : 0), [words]);
  const expectedWord = words[verificationIndex]?.toLowerCase() ?? "";

  useEffect(() => {
    let isMounted = true;

    const loadPhrase = async () => {
      try {
        const storedPhrase = await walletService.getStoredRecoveryPhrase();
        if (!isMounted) return;
        setPhrase(storedPhrase ?? "");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPhrase();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!currentUser) {
    return <Redirect href="/(auth)/welcome" />;
  }

  const handleCopyPhrase = () => {
    if (!phraseValue) {
      setError("No recovery phrase found for this wallet.");
      return;
    }

    Clipboard.setString(phraseValue);
    setCopyStatus("Recovery phrase copied to clipboard.");
    setError("");
  };

  const handleContinue = async () => {
    setError("");

    if (!phrase) {
      setError("No recovery phrase found for this wallet.");
      return;
    }

    if (!hasSavedPhrase) {
      setError("Confirm that you saved your recovery phrase.");
      return;
    }

    if (checkWord.trim().toLowerCase() !== expectedWord) {
      setError(`Word #${verificationIndex + 1} does not match.`);
      return;
    }

    setIsSaving(true);

    try {
      await walletService.markRecoveryBackedUp();
      router.replace("/(auth)/setupPasscode");
    } catch (backupError) {
      const message = backupError instanceof Error ? backupError.message : "Failed to confirm wallet backup.";
      setError(message);
    } finally {
      setIsSaving(false);
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

            <ScrollView
              showsVerticalScrollIndicator
              alwaysBounceVertical
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              contentInsetAdjustmentBehavior="automatic"
              contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(24, insets.bottom + 12) }]}
            >
              <View style={s.headingWrap}>
                <Text style={s.heading}>
                  Back up your <Text style={s.headingMuted}>wallet</Text>
                </Text>
              </View>

              <Text style={s.helperText}>
                Save this recovery phrase offline. Anyone with this phrase can control your funds.
              </Text>

              {isLoading ? (
                <View style={[s.card, styles.loadingCard]}>
                  <ActivityIndicator size="small" color="#171717" />
                </View>
              ) : (
                <View style={s.card}>
                  <View style={s.cardHeader}>
                    <View style={s.cardIconWrap}>
                      <Feather name="shield" size={20} color="#525252" />
                    </View>
                    <View>
                      <Text style={s.cardTitle}>Recovery phrase</Text>
                      <Text style={s.cardSubtitle}>Write down all 12 words in order.</Text>
                    </View>
                  </View>

                  <View style={styles.wordGrid}>
                    {words.map((word, index) => (
                      <View key={`${word}-${index}`} style={styles.wordChip}>
                        <Text style={styles.wordIndex}>{index + 1}.</Text>
                        <Text style={styles.wordText}>{word}</Text>
                      </View>
                    ))}
                  </View>

                  {!isLoading ? (
                    <Pressable style={styles.actionButton} onPress={handleCopyPhrase}>
                      <Feather name="copy" size={16} color="#171717" />
                      <Text style={styles.actionButtonText}>Copy recovery phrase</Text>
                    </Pressable>
                  ) : null}

                  {!!copyStatus ? <Text style={styles.copyStatus}>{copyStatus}</Text> : null}
                </View>
              )}

              <View style={[s.card, { marginTop: 14 }]}>
                <Text style={s.cardTitle}>Quick check</Text>
                <Text style={s.cardSubtitle}>Enter word #{verificationIndex + 1} to continue.</Text>
                <TextInput
                  style={[s.input, s.inputGap, { marginTop: 12 }]}
                  value={checkWord}
                  onChangeText={(value) => {
                    setCheckWord(value);
                    setError("");
                  }}
                  placeholder={`word #${verificationIndex + 1}`}
                  placeholderTextColor="#a3a3a3"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Pressable
                  style={styles.checkboxRow}
                  onPress={() => {
                    setHasSavedPhrase((value) => !value);
                    setError("");
                  }}
                >
                  <View style={[styles.checkbox, hasSavedPhrase && styles.checkboxActive]}>
                    {hasSavedPhrase ? <Feather name="check" size={14} color="#fff" /> : null}
                  </View>
                  <Text style={styles.checkboxLabel}>I saved my recovery phrase offline.</Text>
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
                <Text style={s.footerLabel}>security step</Text>
                <Text style={s.footerTitle}>Continue</Text>
              </View>
              <Pressable style={[s.ctaButton, isSaving && s.ctaButtonDisabled]} onPress={handleContinue} disabled={isSaving}>
                {isSaving ? (
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