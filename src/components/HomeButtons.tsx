import { useRouter } from "expo-router";
import { useState } from "react";
import { homeScreenStyles as s } from "@/styles/homeScreen";
import {TouchableOpacity,Text,View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useWalletStore } from '@/stores/wallet-stores';

export function ScanButton(){

    const router = useRouter();

    return (
      <View style={s.homeButtonView}>
        <TouchableOpacity
            style={s.scanBtn}
            onPress={() => router.push("/scan")}
          >
            <Ionicons name="qr-code" size={20} color="#0a0a1a" />
          </TouchableOpacity>
          <Text style={s.homeButtonText}>Scan any</Text>
          <Text style={s.homeButtonText}>QR code</Text>
      </View>
    )
}

export function IdCardButton() {
  const router = useRouter();

  return(
    <TouchableOpacity
        style={s.idCardBtn}
        onPress={() => router.push("/(me)/profile")}
      >
        <Text>P</Text>
      </TouchableOpacity>
)
}

export default function LockButton() {
  const router = useRouter();
  
  return (
    <View >
      <TouchableOpacity
            style={s.scanBtn}
            onPress={() => router.push("/lock")}
      >
        <Ionicons name="keypad" size={20} color="#0a0a1a" />
      </TouchableOpacity>
          <Text style={s.homeButtonText}>Unlock</Text>
    </View>
  )
}

export function NetworkToggle() {
  const isDevnet = useWalletStore((store) => store.isDevnet);
  const toggleNetwork = useWalletStore((store) => store.toggleNetwork);

  return (
    <View style={[s.networkToggleIconBox, isDevnet && s.networkToggleProfileIconBoxDevnet]}>
      <TouchableOpacity
        onPress={toggleNetwork}
      >
        <Ionicons
          name={isDevnet ? "flask" : "globe"}
          size={20}
          color={isDevnet ? "#F59E0B" : "#14F195"}
        />
      </TouchableOpacity>
    </View>
  )
}