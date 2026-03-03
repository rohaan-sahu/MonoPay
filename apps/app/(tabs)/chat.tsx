import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GradientBackdrop } from "@mpay/components/GradientBackdrop";
import { chatScreen as s } from "@mpay/styles/chatScreen";

const chats = [
  { id: "1", name: "Maya", message: "Thanks, received.", amount: "+$22.00" },
  { id: "2", name: "Kwame", message: "Split dinner?", amount: "-$18.50" },
  { id: "3", name: "Ari", message: "Invoice paid", amount: "+$320.00" },
  { id: "4", name: "Noah", message: "Request sent", amount: "-$7.00" }
];

export default function ChatPage() {
  return (
    <SafeAreaView style={s.page} edges={["top"]}>
      <GradientBackdrop />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <Text style={s.heading}>Social Payments</Text>
        <Text style={s.subtitle}>Chat and transfer in one thread without exposing payment details publicly.</Text>

        {chats.map((chat) => (
          <View key={chat.id} style={s.row}>
            <View style={s.rowLeft}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{chat.name.charAt(0)}</Text>
              </View>
              <View>
                <Text style={s.name}>{chat.name}</Text>
                <Text style={s.meta}>{chat.message}</Text>
              </View>
            </View>
            <Text style={s.amount}>{chat.amount}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
