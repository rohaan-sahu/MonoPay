import {
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState,useEffect } from "react";

// Local imports
import { profileScreenStyles } from "@/styles/screenProfile";
import { useWalletStore } from '@/stores/wallet-stores';
import IdCard from "@/components/IdCard";
import { BackButton } from "@/components/ProfileButtons";
import { backButtonStyles } from "@/styles/buttonBack";
import { short } from "@/helpers/friendsHelper";

// temporary styles
const hist = StyleSheet.create({
    historySection: {
    marginTop: 24,
  },
  historyTitle: {
    color: "#6B7280",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16161D",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#2A2A35",
    gap: 12,
  },
  historyAddress: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "monospace",
  },
  card: {
    backgroundColor: "#16161D",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    marginTop: 28,
    borderWidth: 1,
    borderColor: "#2A2A35",
    position: "relative",
  },
  label: {
    color: "#6B7280",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 8,
  },
  balance: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "700",
  },
  sol: {
    color: "#14F195",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  addr: {
    color: "#9945FF",
    fontSize: 13,
    fontFamily: "monospace",
    marginTop: 16,
    backgroundColor: "#1E1E28",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
});

const s = {...profileScreenStyles, ...backButtonStyles, ...hist};

export default function SettingsScreen() {
  const [balance, setBalance] = useState<number | null>(null);
  const { friend } = useLocalSearchParams();
  const favorites = useWalletStore((store) => store.favorites);
  //const searchHistory = useWalletStore((store) => store.searchHistory);
  const clearHistory = useWalletStore((store) => store.clearHistory);
  const addr = 'jshuixbcbvu';
  const balance2 = 100;
  
  useEffect(() => {
    setBalance(null); // ← switch between null and 100 to test
    //setBalance(100);
}, []);

  const searchHistory = ["9xQeW...", "3kRtP...", "7mNvL..."];

  return (
    <SafeAreaView style={s.profileSafe} edges={["top"]}>
      { /* Back Buttons */}
      <BackButton/>
    
      <ScrollView style={s.profileScroll}>
        {/* Heading */}
        <Text style={s.profileTitle}>{friend}</Text>
        <Text style={s.profileSubtitle}>Share your Id card</Text>

        {/* id card */}
        <IdCard/>

        {/* balance box */}
        {balance2 !== null && (
            <View style={s.card}>
              <Text style={s.label}>SOL Balance</Text>
              <View style={s.balanceRow}>
                <Text style={s.balance}>{balance2.toFixed(4)}</Text>
                <Text style={s.sol}>SOL</Text>
              </View>
              <Text style={s.addr}>{short(addr, 6)}</Text>
            </View>
          )}

        {/* Wallet & account list */}
        {searchHistory.length > 0 && balance === null && (
            <View style={s.historySection}>
              <Text style={s.historyTitle}>Recent Searches</Text>
              {searchHistory.slice(0, 5).map((addr) => (
                <TouchableOpacity
                  key={addr}
                  style={s.historyItem}
                  //onPress={() => searchFromHistory(addr)}
                >
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text style={s.historyAddress} numberOfLines={1}>
                    {short(addr, 8)}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

