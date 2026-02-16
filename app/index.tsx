import { ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { lockScreenStyles as s } from "@/styles/lockScreen";
const styles = s;

export default function lockScreen() {
  return (
    <SafeAreaView>
      <ScrollView>
        <Text>On Boarding screen for new users</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
