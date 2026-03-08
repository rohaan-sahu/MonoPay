import { router } from "expo-router";
import { useRef, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { DismissKeyboard } from "@mpay/components/DismissKeyboard";
import { useAuthStore } from "@mpay/stores/auth-store";
import { cheksAuthScreen as s } from "@mpay/styles/cheksAuthScreen";

const TOTAL_STEPS = 5;
const MWA_ENABLED = (() => {
  const raw = process.env.EXPO_PUBLIC_MONOPAY_MWA_ENABLED?.trim().toLowerCase();
  const enabled = raw === "1" || raw === "true" || raw === "yes" || raw === "on";
  return enabled && Platform.OS === "android";
})();

export default function SignUpScreen() {
  const { beginAuth, connectWallet, connectExternalWallet } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const walletConnectInFlight = useRef(false);

  const handleSignUp = async () => {
    setIsLoading(true);

    try {
      const result = await beginAuth({
        mode: "sign-up",
        channel: "email",
        fullName,
        email
      });

      if (!result.ok) {
        Alert.alert("Sign up failed", result.error ?? "Something went wrong.");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      router.push("/(auth)/otp");
    } catch (error) {
      Alert.alert("Sign up failed", error instanceof Error ? error.message : "Could not start sign-up.");
      setIsLoading(false);
    }
  };

  const handleWalletConnect = async () => {
    if (walletConnectInFlight.current) {
      return;
    }

    walletConnectInFlight.current = true;
    setIsLoading(true);

    try {
      const result = await connectWallet("sign-up");

      if (!result.ok) {
        Alert.alert("Wallet connection failed", result.error ?? "Wallet connection failed.");
        return;
      }

      router.push("/(auth)/wallet-choice");
    } catch {
      Alert.alert("Wallet connection failed", "Wallet connection failed. Please try again.");
    } finally {
      setIsLoading(false);
      walletConnectInFlight.current = false;
    }
  };

  const handleExternalWalletConnect = async () => {
    if (walletConnectInFlight.current) {
      return;
    }

    walletConnectInFlight.current = true;
    setIsLoading(true);

    try {
      const result = await connectExternalWallet("sign-up");

      if (!result.ok) {
        Alert.alert("External wallet connection failed", result.error ?? "External wallet connection failed.");
        return;
      }

      if (result.needsPasscodeSetup) {
        router.push("/(auth)/setup-passcode");
      } else if (result.locked) {
        router.push("/lock");
      } else {
        router.replace("/(tabs)/home");
      }
    } catch (error) {
      Alert.alert("External wallet connection failed", error instanceof Error ? error.message : "External wallet connection failed. Please try again.");
    } finally {
      setIsLoading(false);
      walletConnectInFlight.current = false;
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

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* Heading */}
              <View style={s.headingWrap}>
                <Text style={s.heading}>
                  Let&apos;s get <Text style={s.headingMuted}>started</Text>
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
                  onChangeText={setFullName}
                  placeholder="John"
                  placeholderTextColor="#a3a3a3"
                  autoCapitalize="words"
                />
              </View>

              {/* Email Card */}
              <View style={s.card}>
                <View style={s.cardHeader}>
                  <View style={s.cardIconWrap}>
                    <Feather name="mail" size={20} color="#525252" />
                  </View>
                  <View>
                    <Text style={s.cardTitle}>Email Address</Text>
                    <Text style={s.cardSubtitle}>We&apos;ll verify with a code</Text>
                  </View>
                </View>

                <TextInput
                  style={s.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#a3a3a3"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Divider */}
              <View style={[s.dividerRow, { marginTop: 20 }]}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>or connect wallet</Text>
                <View style={s.dividerLine} />
              </View>

              {/* Wallet Connect */}
              <Pressable
                style={[s.walletConnectButton, isLoading && { opacity: 0.6 }]}
                onPress={handleWalletConnect}
                disabled={isLoading}
              >
                <Feather name="link" size={18} color="#ffffff" />
                <Text style={s.walletConnectText}>Connect Wallet</Text>
              </Pressable>

              {MWA_ENABLED ? (
                <Pressable
                  style={[s.walletConnectButton, { marginTop: 10 }, isLoading && { opacity: 0.6 }]}
                  onPress={handleExternalWalletConnect}
                  disabled={isLoading}
                >
                  <Feather name="smartphone" size={18} color="#ffffff" />
                  <Text style={s.walletConnectText}>Connect External Wallet (Beta)</Text>
                </Pressable>
              ) : null}
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
              <Text style={s.bottomLinkAccent} onPress={() => router.replace("/(auth)/sign-in")}>
                Sign in
              </Text>
            </Text>
          </View>
        </View>
      </DismissKeyboard>
    </SafeAreaView>
  );
}
