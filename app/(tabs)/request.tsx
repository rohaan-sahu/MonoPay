import { ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { onBoardScreenStyles as s } from "@/styles/requestScreen";

export default function RequestScreen() {
  return (
    <SafeAreaView>
      <ScrollView>
        <Text>Request screen</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
