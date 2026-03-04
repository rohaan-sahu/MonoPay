import { Image,View} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

import { testScreenStyles} from "@/styles/screenTest";
import QRCodeView from "@/components/QRcodeView";
import { BackButton } from "@/components/ProfileButtons";
import { friendsScreenStyles} from "@/styles/screenFriends";
import { qrScreenStyles } from "@/styles/screenQr";

const s = {...testScreenStyles, ...friendsScreenStyles,...qrScreenStyles};
const item = require ("../assets/images/MonoPay-splash-screen-transparent.png");

export default function TestScreen() {

  return (
      <SafeAreaView style={s.friendsSafe} edges={["top"]}>
        <BackButton/>
        <View style={s.QrPageMessageLogo}>
          <Image source = {item} style={{width: 70, height: 70, resizeMode: "cover",}} />
        </View>
        <QRCodeView/>
      </SafeAreaView>
  );
}
