import { Pressable,ScrollView, Text,View,Button, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

import { testScreenStyles as s } from "@/styles/testScreen";

export default function TestScreen() {

  return (
    <View style ={s.container}>
      <ScrollView >
        <TouchableOpacity style= {s.button}>
            <Ionicons name="qr-code"  />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
