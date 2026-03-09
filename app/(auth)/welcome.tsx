import { Redirect, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@mpay/stores/auth-store";

const logo = require("../../assets/images/splashlogo.png");

const displayFont = Platform.select({
  ios: "Bricolage Grotesque",
  android: "sans-serif-light",
  default: "sans-serif"
});

const bodyFont = Platform.select({
  ios: "Inter",
  android: "sans-serif",
  default: "sans-serif"
});

export default function WelcomeScreen() {
  const { currentUser, isHydrating, isLocked } = useAuthStore();

  if (isHydrating) {
    return null;
  }

  if (currentUser) {
    if (!currentUser.walletAddress) {
      return <Redirect href="/(auth)/wallet-choice" />;
    }

    return <Redirect href={isLocked ? "/lock" : "/(tabs)/home"} />;
  }

  return (
    <View style={s.page}>
      {/* Background gradient orbs */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={s.orbTopRight} />
        <View style={s.orbBottomLeft} />
      </View>

      <SafeAreaView style={s.safe}>
        <View style={s.container}>
          {/* Logo + brand */}
          <View style={s.heroSection}>
            <View style={s.logoGlow}>
              <Image source={logo} style={s.logo} resizeMode="contain" />
            </View>
            <Text style={s.brandName}>MonoPay</Text>
            <Text style={s.tagline}>Payments, simplified.</Text>
          </View>

          {/* Bottom content */}
          <View style={s.bottomBlock}>
            <Text style={s.headline}>
              One App{"\n"}That Manages{"\n"}
              <Text style={s.headlineAccent}>Your Money</Text>
            </Text>

            <Pressable style={s.ctaButton} onPress={() => router.push("/(auth)/sign-up")}>
              <Text style={s.ctaText}>Get Started</Text>
              <Feather name="arrow-right" size={20} color="#ffffff" />
            </Pressable>

            <Text style={s.signInText}>
              Already have an account?{" "}
              <Text style={s.signInLink} onPress={() => router.push("/(auth)/sign-in")}>
                Sign in
              </Text>
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#111114",
  },
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
  },

  /* Background orbs */
  orbTopRight: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -80,
    right: -60,
    backgroundColor: "rgba(90,105,130,0.2)",
  },
  orbBottomLeft: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    bottom: -40,
    left: -60,
    backgroundColor: "rgba(60,68,80,0.15)",
  },

  /* Hero section */
  heroSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
    gap: 12,
  },
  logoGlow: {
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(140,155,175,0.06)",
  },
  logo: {
    width: 260,
    height: 260,
  },
  brandName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#e8eaed",
    letterSpacing: -0.8,
    fontFamily: displayFont,
    marginTop: 8,
  },
  tagline: {
    fontSize: 15,
    color: "rgba(255,255,255,0.4)",
    fontFamily: bodyFont,
  },

  /* Bottom block */
  bottomBlock: {
    paddingHorizontal: 28,
    paddingBottom: 28,
    alignItems: "center",
  },
  headline: {
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1.2,
    fontWeight: "700",
    color: "#e8eaed",
    textAlign: "center",
    fontFamily: displayFont,
    marginBottom: 32,
  },
  headlineAccent: {
    color: "rgba(160,170,185,0.6)",
    fontFamily: displayFont,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#2a2d32",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  ctaText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "600",
    fontFamily: bodyFont,
  },
  signInText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    fontFamily: bodyFont,
  },
  signInLink: {
    color: "#e8eaed",
    fontWeight: "600",
    textDecorationLine: "underline",
    fontFamily: bodyFont,
  },
});
