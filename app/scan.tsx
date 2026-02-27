import { StyleSheet, Text, View,TouchableOpacity } from "react-native";
import { scanScreenStyles as styles } from "@/styles/scanScreen";
import { useRouter } from "expo-router";

import ScannerCamera from "@/components/CameraView";

export default function Send() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
      <ScannerCamera/>
    </View>
  );
}