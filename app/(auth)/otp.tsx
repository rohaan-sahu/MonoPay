import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { DismissKeyboard } from "@mpay/components/DismissKeyboard";
import { useAuthStore } from "@mpay/stores/auth-store";
import { cheksAuthScreen as s } from "@mpay/styles/cheksAuthScreen";

const OTP_LENGTH = 6;

export default function OtpScreen() {
  const { pendingAuth, verifyOtp, resendOtp } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [resendCountdown, setResendCountdown] = useState(40);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const targetLabel = useMemo(() => {
    if (!pendingAuth) return "";

    if (pendingAuth.channel === "email") {
      const email = pendingAuth.email ?? "";
      const [local, domain] = email.split("@");
      if (!local || !domain) return email;
      const maskedLocal = local.length < 3 ? `${local[0] ?? ""}*` : `${local.slice(0, 2)}***`;
      return `${maskedLocal}@${domain}`;
    }

    const phone = pendingAuth.phone ?? "";
    const lastFour = phone.slice(-4);
    return `${phone.slice(0, -4).replace(/./g, "*")}${lastFour}`;
  }, [pendingAuth]);

  const handleChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;

      const newOtp = [...otp];
      newOtp[index] = value.slice(-1);
      setOtp(newOtp);

      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otp]
  );

  const handleKeyPress = useCallback(
    (index: number, key: string) => {
      if (key === "Backspace" && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [otp]
  );

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      Alert.alert("Verification failed", "Please enter all 6 digits.");
      return;
    }

    const authMode = pendingAuth?.mode;
    setIsSubmitting(true);
    const result = await verifyOtp(code);
    setIsSubmitting(false);

    if (!result.ok) {
      Alert.alert("Verification failed", result.error ?? "Unable to verify code.");
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      return;
    }

    if (result.needsWalletConflictResolution) {
      router.replace("/(auth)/wallet-conflict");
      return;
    }

    if (result.needsWalletImport) {
      router.replace("/(auth)/wallet-import");
      return;
    }

    if (result.needsWalletSetup) {
      router.replace("/(auth)/wallet-choice");
      return;
    }

    if (result.needsPasscodeSetup) {
      if (authMode === "sign-up") {
        router.replace("/(auth)/wallet-choice");
        return;
      }
      router.replace("/(auth)/setup-passcode");
      return;
    }

    if (result.locked) {
      router.replace("/lock");
      return;
    }

    router.replace("/(tabs)/home");
  };

  const handleResend = async () => {
    if (resendCountdown > 0 || isResending) {
      return;
    }

    setIsResending(true);
    const result = await resendOtp();
    setIsResending(false);

    if (!result.ok) {
      Alert.alert("Resend failed", result.error ?? "Could not resend OTP.");
      return;
    }

    setResendCountdown(40);
  };

  if (!pendingAuth) {
    return (
      <SafeAreaView style={s.page}>
        <View style={s.content}>
          <Text style={s.cardSubtitle}>No verification in progress.</Text>
        </View>
      </SafeAreaView>
    );
  }

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
              <View style={{ width: 48 }} />
            </View>

            {/* Heading */}
            <View style={s.headingWrap}>
              <Text style={s.heading}>
                Verify your{"\n"}
                <Text style={s.headingMuted}>
                  {pendingAuth.channel === "email" ? "email" : "number"}
                </Text>
              </Text>
              <Text style={[s.cardSubtitle, { marginTop: 12, fontSize: 14 }]}>
                We sent a 6-digit code to {targetLabel}
              </Text>
            </View>

            {/* OTP Cells */}
            <View style={s.otpRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[s.otpCell, focusedIndex === index && s.otpCellFocused]}
                  value={digit}
                  onChangeText={(value) => handleChange(index, value)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                  onFocus={() => setFocusedIndex(index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            {/* Resend */}
            {resendCountdown > 0 ? (
              <Text style={s.resendText}>
                Resend code in <Text style={s.resendAccent}>{resendCountdown}s</Text>
              </Text>
            ) : (
              <Pressable onPress={handleResend} disabled={isResending}>
                <Text style={[s.resendText, s.resendAccent, { textDecorationLine: "underline" }]}>
                  {isResending ? "Sending..." : "Resend code"}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Footer */}
          <View style={[s.footerShell, { paddingBottom: Math.max(insets.bottom, 8) }]}>
            <View style={s.footer}>
              <Text style={[s.footerTitle, { fontSize: 22 }]}>Verify</Text>
              <Pressable
                style={[s.ctaButton, (otp.join("").length !== OTP_LENGTH || isSubmitting) && s.ctaButtonDisabled]}
                onPress={handleVerify}
                disabled={otp.join("").length !== OTP_LENGTH || isSubmitting}
              >
                {isSubmitting ? (
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
