import { router } from "expo-router";
import { useRef, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { DismissKeyboard } from "@mpay/components/DismissKeyboard";
import { useAuthStore } from "@mpay/stores/auth-store";
import { cheksAuthScreen as s } from "@mpay/styles/cheksAuthScreen";

type Tab = "phone" | "email";
const PHONE_OTP_ENABLED = process.env.EXPO_PUBLIC_MONOPAY_ACCOUNT_LINK_MODE === "email_phone";

export default function SignInScreen() {
  const { beginAuth, connectWallet } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>(PHONE_OTP_ENABLED ? "phone" : "email");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const walletConnectInFlight = useRef(false);

  const handleSignIn = async () => {
    setError("");
    setIsLoading(true);

    try {
      const result = await beginAuth({
        mode: "sign-in",
        channel: tab,
        phone: tab === "phone" ? phone : undefined,
        email: tab === "email" ? email : undefined
      });

      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      router.push("/(auth)/otp");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not start sign-in.");
      setIsLoading(false);
    }
  };

  const handleWalletConnect = async () => {
    if (walletConnectInFlight.current) {
      return;
    }

    walletConnectInFlight.current = true;
    const traceId = `wc-${Date.now().toString(36)}`;
    setError("");
    setIsLoading(true);
    console.log("[wallet-connect-trace] ui:start", { traceId, screen: "sign-in" });

    try {
      const result = await connectWallet("sign-in");
      console.log("[wallet-connect-trace] ui:result", {
        traceId,
        ok: result.ok,
        locked: result.locked,
        needsPasscodeSetup: result.needsPasscodeSetup,
        error: result.error,
      });

      if (!result.ok) {
        setError(result.error ?? "Wallet connection failed.");
        return;
      }

      if (result.locked) {
        router.push("/lock");
      } else if (result.needsPasscodeSetup) {
        router.push("/(auth)/setup-passcode");
      } else {
        router.replace("/(tabs)/home");
      }
    } catch (error) {
      console.error("[wallet-connect-trace] ui:exception", {
        traceId,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      setError(error instanceof Error ? error.message : "Wallet connection failed. Please try again.");
    } finally {
      console.log("[wallet-connect-trace] ui:done", { traceId });
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
              <Pressable style={s.iconButton}>
                <Feather name="help-circle" size={20} color="#525252" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Heading */}
              <View style={s.headingWrap}>
                <Text style={s.heading}>
                  Welcome <Text style={s.headingMuted}>back</Text>
                </Text>
              </View>

              {/* Tabs */}
              <View style={s.tabRow}>
                <Pressable
                  disabled={!PHONE_OTP_ENABLED}
                  style={!PHONE_OTP_ENABLED ? { opacity: 0.55 } : undefined}
                  onPress={() => {
                    if (!PHONE_OTP_ENABLED) {
                      setError("Phone OTP is disabled for now. Use email.");
                      return;
                    }
                    setTab("phone");
                    setError("");
                  }}
                >
                  <Text style={tab === "phone" ? s.tabActive : s.tabInactive}>Phone</Text>
                </Pressable>
                <Pressable onPress={() => { setTab("email"); setError(""); }}>
                  <Text style={tab === "email" ? s.tabActive : s.tabInactive}>Email</Text>
                </Pressable>
              </View>

              {!PHONE_OTP_ENABLED ? <Text style={[s.cardSubtitle, { marginBottom: 10 }]}>Phone OTP coming soon</Text> : null}

              {/* Input Card */}
              <View style={s.card}>
                <View style={s.cardHeader}>
                  <View style={s.cardIconWrap}>
                    <Feather name={tab === "phone" ? "phone" : "mail"} size={22} color="#525252" />
                  </View>
                  <View>
                    <Text style={s.cardTitle}>{tab === "phone" ? "Phone Number" : "Email Address"}</Text>
                    <Text style={s.cardSubtitle}>
                      {tab === "phone" ? "Enter your registered number" : "Enter your registered email"}
                    </Text>
                  </View>
                </View>

                {tab === "phone" ? (
                  <TextInput
                    style={s.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+1 (555) 000-0000"
                    placeholderTextColor="#a3a3a3"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <TextInput
                    style={s.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor="#a3a3a3"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}

                {!!error && (
                  <View style={s.errorBox}>
                    <Text style={s.errorText}>{error}</Text>
                  </View>
                )}

                {/* Divider */}
                <View style={s.dividerRow}>
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
                  <Feather name="link" size={18} color="#171717" />
                  <Text style={s.walletConnectText}>Connect Wallet</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>

          {/* Footer — outside content to avoid paddingHorizontal and sits flush at bottom */}
          <View style={[s.footerShell, { paddingBottom: Math.max(insets.bottom, 8) }]}>
            <View style={s.footer}>
              <View>
                <Text style={s.footerLabel}>ready to</Text>
                <Text style={s.footerTitle}>Sign In</Text>
              </View>
              <Pressable
                style={[s.ctaButton, isLoading && s.ctaButtonDisabled]}
                onPress={handleSignIn}
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
              Don&apos;t have an account?{" "}
              <Text style={s.bottomLinkAccent} onPress={() => router.replace("/(auth)/sign-up")}>
                Sign up
              </Text>
            </Text>
          </View>
        </View>
      </DismissKeyboard>
    </SafeAreaView>
  );
}
