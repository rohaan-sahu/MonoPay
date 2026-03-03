import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GradientBackdrop } from "@mpay/components/GradientBackdrop";
import { scanScreen as s } from "@mpay/styles/scanScreen";

export default function ScanPage() {
  return (
    <SafeAreaView style={s.page} edges={["top"]}>
      <GradientBackdrop />

      <Text style={s.heading}>Scan to Pay</Text>
      <Text style={s.subtitle}>Point your camera at a MonoPay QR code to pay merchants or friends instantly.</Text>

      <View style={s.scanBox}>
        <View style={s.scanFrame}>
          <Text style={s.scanIcon}>Q</Text>
          <Text style={s.scanHint}>Camera integration starts next. This is the scan frame shell.</Text>
        </View>
      </View>

      <Pressable style={s.actionButton}>
        <Text style={s.actionButtonText}>Open camera</Text>
      </Pressable>
    </SafeAreaView>
  );
}
