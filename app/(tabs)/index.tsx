import { View,Pressable,ScrollView, Text,TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useState } from "react";
import { useRouter } from "expo-router";
import { homeScreenStyles as s } from "@/styles/screenHome";
import { SearchBarRound } from "@/components/SearchBars";
import { FriendListButton, IdCardButton, NetworkToggle, QRCodeButton, ScanButton } from "@/components/HomeButtons";
import SlideCards from "@/components/SlideCards";
import LockScreen from "../lock";
import IdCard from "@/components/IdCard";
import QRCodeView, { QRCodeGen } from "@/components/QRcodeView";
import GoogleScanScreen from "../goggleScan";


export default function SendScreen() {
  const [search,setSearch] = useState("");
  const router = useRouter();

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView>
        <View style={s.headerContainer}>
          <NetworkToggle/>
          <SearchBarRound search={search} setSearch={setSearch} placeHolder="find everyone here..."/>
          <IdCardButton/>
        </View>
        <View style = {s.bannerContainer}>
          <SlideCards />
        </View>
        <View style ={s.btnContainer}>
          <ScanButton/>
          <FriendListButton/>
          <QRCodeButton/>
          <ScanButton/>
        </View>
        <LockScreen/>
        <IdCard/>
        <QRCodeGen/>
        <GoogleScanScreen/>
      </ScrollView>
    </SafeAreaView>
  );
}
