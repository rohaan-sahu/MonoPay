import { View,Pressable,ScrollView, Text,TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useState } from "react";
import { useRouter } from "expo-router";
import { homeScreenStyles as s } from "@/styles/homeScreen";
import SearchBar from "@/components/SearchBar";
import { IdCard, ScanButton } from "@/components/HomeButtons";
import SlideCards from "@/components/SlideCards";
import LockScreen from "../lock";

export default function SendScreen() {
  const [search,setSearch] = useState("");
  const router = useRouter();

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView>
        <View style={s.headerContainer}>
          <SearchBar search={search} setSearch={setSearch}/>
          <IdCard/>
        </View>
        <View style = {s.bannerContainer}>
          <SlideCards />
        </View>
        <View style ={s.btnContainer}>
          <ScanButton/>
          <ScanButton/>
          <ScanButton/>
          <ScanButton/>
        </View>
        <LockScreen/>
  </ScrollView>
    </SafeAreaView>
  );
}
