import {
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Local imports
import { profileScreenStyles } from "@/styles/screenProfile";
import { useWalletStore } from '@/stores/wallet-stores';
import IdCard from "@/components/IdCard";
import { BackButton, ProfileNetworkToggleBox } from "@/components/ProfileButtons";
import { backButtonStyles } from "@/styles/buttonBack";

const s = {...profileScreenStyles, ...backButtonStyles};

export default function SettingsScreen() {
  const favorites = useWalletStore((store) => store.favorites);
  const searchHistory = useWalletStore((store) => store.searchHistory);
  const clearHistory = useWalletStore((store) => store.clearHistory);

  return (
    <SafeAreaView style={s.profileSafe} edges={["top"]}>
      { /* Back Buttons */}
      <BackButton/>
    
      <ScrollView style={s.profileScroll}>
        {/* Heading */}
        <Text style={s.profileTitle}>Profile</Text>
        <Text style={s.profileSubtitle}>Share your Id card</Text>

        {/* id card */}
        <IdCard/>

        {/* network section */}
        <Text style={s.profileSectionTitle}>Network</Text>
        <View style={s.profileCard}>
          <ProfileNetworkToggleBox />
        </View>

        {/* To be modified. stats section */}
        <Text style={s.profileSectionTitle}>Data</Text>
        <View style={s.profileCard}>
          <TouchableOpacity 
            style={s.profileRow} 
            //onPress={() => router.push("/watchlist")}
          >
            <View style={s.profileRowLeft}>
              <View style={s.profileIconBox}>
                <Ionicons name="heart" size={20} color="#14F195" />
              </View>
              <Text style={s.profileLabel}>Saved Wallets</Text>
            </View>
            <View style={s.profileRowRight}>
              <View style={s.profileBadge}>
                <Text style={s.profileBadgeText}>{favorites.length}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </View>
          </TouchableOpacity>

          <View style={s.profileDivider} />

          <View style={s.profileRow}>
            <View style={s.profileRowLeft}>
              <View style={s.profileIconBox}>
                <Ionicons name="time" size={20} color="#14F195" />
              </View>
              <Text style={s.profileLabel}>Search History</Text>
            </View>
            <View style={s.profileBadge}>
              <Text style={s.profileBadgeText}>{searchHistory.length}</Text>
            </View>
          </View>
        </View>

        {/* danger zone */}
        <Text style={s.profileSectionTitle}>Danger Zone</Text>
        <TouchableOpacity
          style={s.profileDangerButton}
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
          <Ionicons name="trash-outline" size={20} color="#efbf44" />
          <Text style={s.profileDangerText}>Clear Search History</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}