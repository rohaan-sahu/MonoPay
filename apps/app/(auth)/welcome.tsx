import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const heroImage = require("../../assets/welcome-hero.png");

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
  return (
    <SafeAreaView style={s.page}>
      <View style={s.container}>
        {/* Hero Illustration */}
        <View style={s.heroWrap}>
          <Image source={heroImage} style={s.heroImage} resizeMode="contain" />
        </View>

        {/* Bottom Content */}
        <View style={s.bottomBlock}>
          {/* Headline */}
          <Text style={s.headline}>
            One App{"\n"}That Manages{"\n"}
            <Text style={s.headlineMuted}>Your Money</Text>
          </Text>

          {/* CTA */}
          <Pressable style={s.fab} onPress={() => router.push("/(auth)/sign-up")}>
            <Feather name="arrow-right" size={24} color="#ffffff" />
          </Pressable>

          {/* Sign in link */}
          <Text style={s.signInText}>
            Already have an account?{" "}
            <Text style={s.signInLink} onPress={() => router.push("/(auth)/sign-in")}>
              Sign in
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#fdfdfd"
  },
  container: {
    flex: 1,
    justifyContent: "space-between"
  },
  heroWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingTop: 24
  },
  heroImage: {
    width: "100%",
    height: "100%"
  },
  bottomBlock: {
    paddingHorizontal: 28,
    paddingBottom: 24,
    alignItems: "center"
  },
  headline: {
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -1.2,
    fontWeight: "700",
    color: "#171717",
    textAlign: "center",
    fontFamily: displayFont,
    marginBottom: 28
  },
  headlineMuted: {
    color: "#a3a3a3",
    fontFamily: displayFont
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#171717",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20
  },
  signInText: {
    color: "#737373",
    fontSize: 14,
    fontFamily: bodyFont
  },
  signInLink: {
    color: "#171717",
    fontWeight: "600",
    textDecorationLine: "underline",
    fontFamily: bodyFont
  }
});
