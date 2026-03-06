import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const heroImage = require("../../assets/images/MonoPay-splash-screen.png");

import { authWelcomeStyles as s  } from "@/styles/screenAuth";

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
          <Pressable style={s.fab} onPress={() => router.push("/(auth)/signUp")}>
            <Feather name="arrow-right" size={24} color="#ffffff" />
          </Pressable>

          {/* Sign in link */}
          <Text style={s.signInText}>
            Already have an account?{" "}
            <Text style={s.signInLink} onPress={() => router.push("/(auth)/signIn")}>
              Sign in
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}