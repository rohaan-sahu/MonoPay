import { router } from "expo-router";
import { useRef, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { DismissKeyboard } from "@/components/DismissKeyboard";
import { useAuthStore } from "@/stores/local-auth-stores";
import { cheksAuthScreen as s } from "@/styles/screenAuth";

const TOTAL_STEPS = 5;


export default function SignUpScreen() {
  const { beginAuth, connectWallet } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = () => {
    setError("");
    setIsLoading(true);

    const result = beginAuth({
      mode: "sign-up",
      channel: "phone",
      fullName,
      phone
    });

    setIsLoading(false);

    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
      return;
    }

    router.push("/(auth)/otp");
  };

  const handleWalletConnect = async () => {
    setError("");
    setIsLoading(true);

    try {
      const result = await connectWallet("sign-up");

      if (!result.ok) {
        setError(result.error ?? "Wallet connection failed.");
        return;
      }

      router.push("/(auth)/walletChoice");
    } catch {
      setError("Wallet connection failed. Please try again.");
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
            {/* Header */}
            <View style={s.headerRow}>
              <Pressable style={s.iconButton} onPress={() => router.back()}>
                <Feather name="arrow-left" size={20} color="#525252" />
              </Pressable>

              {/* Progress Bar */}
              <View style={s.progressRow}>
                {[1, 2, 3, 4, 5].map((step) => (
                  <View
                    key={step}
                    style={[
                      s.progressDot,
                      step === 1 && s.progressDotActive
                    ]}
                  />
                ))}
              </View>

              <View style={{ width: 48 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Heading */}
              <View style={s.headingWrap}>
                <Text style={s.heading}>
                  Let's get <Text style={s.headingMuted}>started</Text>
                </Text>
              </View>

              {/* Name Card */}
              <View style={[s.card, { marginBottom: 14 }]}>
                <View style={s.cardHeader}>
                  <View style={s.cardIconWrap}>
                    <Feather name="user" size={20} color="#525252" />
                  </View>
                  <View>
                    <Text style={s.cardTitle}>Your Name</Text>
                    <Text style={s.cardSubtitle}>What should we call you?</Text>
                  </View>
                </View>

                <TextInput
                  style={s.input}
                  value={fullName}
                  onChangeText={(v) => { setFullName(v); setError(""); }}
                  placeholder="John"
                  placeholderTextColor="#a3a3a3"
                  autoCapitalize="words"
                />
              </View>

              {/* Phone Card */}
              <View style={s.card}>
                <View style={s.cardHeader}>
                  <View style={s.cardIconWrap}>
                    <Feather name="smartphone" size={20} color="#525252" />
                  </View>
                  <View>
                    <Text style={s.cardTitle}>Phone Number</Text>
                    <Text style={s.cardSubtitle}>We'll verify with a code</Text>
                  </View>
                </View>

                <TextInput
                  style={s.input}
                  value={phone}
                  onChangeText={(v) => { setPhone(v); setError(""); }}
                  placeholder="+234 810 000 0000"
                  placeholderTextColor="#a3a3a3"
                  keyboardType="phone-pad"
                />
              </View>

              {!!error && (
                <View style={[s.errorBox, { marginTop: 14 }]}>
                  <Text style={s.errorText}>{error}</Text>
                </View>
              )}

              {/* Divider */}
              <View style={[s.dividerRow, { marginTop: 20 }]}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>or connect wallet</Text>
                <View style={s.dividerLine} />
              </View>

              {/* Wallet Connect */}
              <Pressable style={s.walletConnectButton} onPress={handleWalletConnect}>
                <Feather name="link" size={18} color="#171717" />
                <Text style={s.walletConnectText}>Connect Wallet</Text>
              </Pressable>
            </ScrollView>
          </View>

          {/* Footer */}
          <View style={[s.footerShell, { paddingBottom: Math.max(insets.bottom, 8) }]}>
            <View style={s.footer}>
              <View>
                <Text style={s.footerLabel}>step 1 of {TOTAL_STEPS}</Text>
                <Text style={s.footerTitle}>Verify</Text>
              </View>
              <Pressable
                style={[s.ctaButton, isLoading && s.ctaButtonDisabled]}
                onPress={handleSignUp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#171717" />
                ) : (
                  <Feather name="arrow-right" size={24} color="#171717" />
                )}
              </Pressable>
            </View>

            <Text style={s.bottomLink}>
              Already have an account?{" "}
              <Text style={s.bottomLinkAccent} onPress={() => router.replace("/(auth)/signIn")}>
                Sign in
              </Text>
            </Text>
          </View>
        </View>
      </DismissKeyboard>
    </SafeAreaView>
  );
}
