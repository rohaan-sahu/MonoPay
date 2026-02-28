import {
  StyleSheet,
  Text,
  View,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Local imports
import { settingsStyles as s } from "@/styles/settingsStyles";
import { useWalletStore } from '@/stores/wallet-stores';

export default function SettingsScreen() {
  const router = useRouter();
  const isDevnet = useWalletStore((s) => s.isDevnet);
  const toggleNetwork = useWalletStore((s) => s.toggleNetwork);
  const favorites = useWalletStore((s) => s.favorites);
  const searchHistory = useWalletStore((s) => s.searchHistory);
  const clearHistory = useWalletStore((s) => s.clearHistory);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView style={s.scroll}>
        <Text style={s.title}>Settings</Text>
        <Text style={s.subtitle}>Configure your wallet explorer</Text>

        {/* network section */}
        <Text style={s.sectionTitle}>Network</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={s.rowLeft}>
              <View style={[s.iconBox, isDevnet && s.iconBoxDevnet]}>
                <Ionicons
                  name={isDevnet ? "flask" : "globe"}
                  size={20}
                  color={isDevnet ? "#F59E0B" : "#14F195"}
                />
              </View>
              <View>
                <Text style={s.label}>{isDevnet ? "Devnet" : "Mainnet"}</Text>
                <Text style={s.sublabel}>
                  {isDevnet ? "Testing network (free SOL)" : "Production network"}
                </Text>
              </View>
            </View>
            <Switch
              value={isDevnet}
              onValueChange={toggleNetwork}
              trackColor={{ true: "#14F195", false: "#2A2A35" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* stats section */}
        <Text style={s.sectionTitle}>Data</Text>
        <View style={s.card}>
          <TouchableOpacity 
            style={s.row} 
            //onPress={() => router.push("/watchlist")}
          >
            <View style={s.rowLeft}>
              <View style={s.iconBox}>
                <Ionicons name="heart" size={20} color="#14F195" />
              </View>
              <Text style={s.label}>Saved Wallets</Text>
            </View>
            <View style={s.rowRight}>
              <View style={s.badge}>
                <Text style={s.badgeText}>{favorites.length}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </View>
          </TouchableOpacity>

          <View style={s.divider} />

          <View style={s.row}>
            <View style={s.rowLeft}>
              <View style={s.iconBox}>
                <Ionicons name="time" size={20} color="#14F195" />
              </View>
              <Text style={s.label}>Search History</Text>
            </View>
            <View style={s.badge}>
              <Text style={s.badgeText}>{searchHistory.length}</Text>
            </View>
          </View>
        </View>

        {/* danger zone */}
        <Text style={s.sectionTitle}>Danger Zone</Text>
        <TouchableOpacity
          style={s.dangerButton}
          onPress={() => {
            Alert.alert(
              "Clear History",
              "This will remove all your search history. Favorites won't be affected.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Clear", style: "destructive", onPress: clearHistory },
              ]
            );
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
          <Text style={s.dangerText}>Clear Search History</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

