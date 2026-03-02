import { Text,TouchableOpacity,View, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Local imports
import { friendsScreenStyles } from "@/styles/screenFriends";
import { backButtonStyles } from "@/styles/buttonBack";
import { useWalletStore } from "@/stores/wallet-stores";

const s = {...friendsScreenStyles, ...backButtonStyles};

export  function BackButton() {
    const router = useRouter();
    
    return (
        <TouchableOpacity style = {s.backButton} onPress = {() => router.back()}>
            <Ionicons name = "arrow-back" size={24} color= "#fff"/>
            <Text style = {s.backText}>Back</Text>
        </TouchableOpacity>
    )
}

export  function OptionsButton() {

    return (
        <TouchableOpacity style = {s.backButton} >
            <Ionicons name = "options" size={24} color= "#fff"/>
        </TouchableOpacity>
    )
}