import {
  StyleSheet,
  View,
  StatusBar,
  Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {useState} from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Local imports
import { friendsScreenStyles as s } from "@/styles/screenFriends";
import { useWalletStore } from '@/stores/wallet-stores';
import { BackButton } from "@/components/ProfileButtons";
import { SearchBarRect } from "@/components/SearchBars";
import CombiList from "@/components/CombiList";

const item = require ("../../assets/images/MonoPay-splash-screen-transparent.png");

export default function SettingsScreen() {
  const favorites = useWalletStore((store) => store.favorites);
  const searchHistory = useWalletStore((store) => store.searchHistory);
  const clearHistory = useWalletStore((store) => store.clearHistory);
  
  const [search,setSearch] = useState("");
  const router = useRouter();

  return (
    <SafeAreaView style={s.friendsSafe} edges={["top"]}>
      { /* Back Buttons */}
      <BackButton/>

      <View>
        <View style={s.friendsHeaderContainer}>
            <SearchBarRect search={search} setSearch={setSearch} placeHolder="find your friends here..."/>
        </View>
        <View style={s.friendsMessageLogo}>
            <Image source = {item} style={{width: 70, height: 70, resizeMode: "cover",}} />
        </View>
        
        <View style={s.friendsListContainer}>
            <CombiList />
        </View>
      </View>

    </SafeAreaView>
  );
}