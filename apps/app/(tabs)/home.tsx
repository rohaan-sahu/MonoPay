import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GradientBackdrop } from "@mpay/components/GradientBackdrop";
import { useAuthStore } from "@mpay/stores/auth-store";
import { homeScreen as s } from "@mpay/styles/homeScreen";

const activities = [
  { id: "1", name: "Ayo's Cafe", meta: "QR payment • 2m ago", amount: "-$14.20", incoming: false },
  { id: "2", name: "Nina Cole", meta: "Request settled • 1h ago", amount: "+$55.00", incoming: true },
  { id: "3", name: "Studio Rent", meta: "Scheduled transfer • Today", amount: "-$420.00", incoming: false }
];

export default function HomeScreen() {
  const { currentUser } = useAuthStore();

  return (
    <SafeAreaView style={s.page} edges={["top"]}>
      <GradientBackdrop />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <View>
          <Text style={s.greeting}>HELLO</Text>
          <Text style={s.title}>{currentUser?.fullName ?? "MonoPay User"}</Text>
        </View>

        <View style={s.balanceCard}>
          <Text style={s.balanceLabel}>Available balance</Text>
          <View style={s.balanceRow}>
            <View>
              <Text style={s.balanceValue}>$2,493.67</Text>
              <Text style={s.currencyTag}>USDC • Devnet</Text>
            </View>
          </View>
          <View style={s.actionRow}>
            <View style={s.quickAction}>
              <Text style={s.quickActionIcon}>↑</Text>
              <Text style={s.quickActionLabel}>Send</Text>
            </View>
            <View style={s.quickAction}>
              <Text style={s.quickActionIcon}>↓</Text>
              <Text style={s.quickActionLabel}>Request</Text>
            </View>
            <View style={s.quickAction}>
              <Text style={s.quickActionIcon}>Q</Text>
              <Text style={s.quickActionLabel}>QR Pay</Text>
            </View>
          </View>
        </View>

        <Text style={s.sectionTitle}>Recent activity</Text>
        <View style={s.activityCard}>
          {activities.map((item) => (
            <View key={item.id} style={s.activityRow}>
              <View>
                <Text style={s.activityName}>{item.name}</Text>
                <Text style={s.activityMeta}>{item.meta}</Text>
              </View>
              <Text style={item.incoming ? s.activityAmountIn : s.activityAmountOut}>{item.amount}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
