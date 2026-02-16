import { ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { homeScreenStyles as s } from "@/styles/homeScreen";
const styles = s;

export default function HomeScreen() {
  return (
    <SafeAreaView>
      <ScrollView>
        <Text>Home screen</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
