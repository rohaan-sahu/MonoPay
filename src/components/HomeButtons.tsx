import { useRouter } from "expo-router";
import { useState } from "react";
import { homeScreenStyles as s } from "@/styles/homeScreen";
import {TouchableOpacity,Text,View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
  const [count,setCount] = useState<number>(0);

  return(
    <TouchableOpacity
        style={s.idCardBtn}
        onPress={() => setCount((s)=> s+1)}
      >
        <Text>{count}</Text>
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