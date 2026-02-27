import { View,Pressable,ScrollView, Text,TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useState } from "react";
import { useRouter } from "expo-router";
import { homeScreenStyles as s } from "@/styles/homeScreen";
import SearchBar from "@/components/SearchBar";

export default function SendScreen() {
  const [search,setSearch] = useState("");
  const [count,setCount] = useState<number>(0);
  const router = useRouter();

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView>
        <SearchBar search={search} setSearch={setSearch}/>
        <Pressable onPress={() => setCount((s)=> s+1)}>
          <Text>Home screen</Text>
        </Pressable>
        <Text>{count}</Text>
        <View style ={s.btnContainer}>
          <TouchableOpacity
            style={s.scanBtn}
            onPress={() => router.push("/scan")}
          >
            <Ionicons name="qr-code" size={20} color="#0a0a1a" />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.scanBtn}
            onPress={() => router.push("/scan")}
          >
            <Ionicons name="qr-code" size={20} color="#0a0a1a" />
          </TouchableOpacity><TouchableOpacity
            style={s.scanBtn}
            onPress={() => router.push("/scan")}
          >
            <Ionicons name="qr-code" size={20} color="#0a0a1a" />
          </TouchableOpacity><TouchableOpacity
            style={s.scanBtn}
            onPress={() => router.push("/scan")}
          >
            <Ionicons name="qr-code" size={20} color="#0a0a1a" />
          </TouchableOpacity>
        </View>
  </ScrollView>
    </SafeAreaView>
  );
}
