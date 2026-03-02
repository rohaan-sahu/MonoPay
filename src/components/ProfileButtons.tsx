import { Text,TouchableOpacity,View, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Local imports
import { profileScreenStyles } from "@/styles/screenProfile";
import { useWalletStore } from "@/stores/wallet-stores";
import { backButtonStyles } from "@/styles/buttonBack";

const s = {
    ...profileScreenStyles,
    ...backButtonStyles
};

export  function BackButton() {
    const router = useRouter();
    
    return (
        <TouchableOpacity style = {s.backButton} onPress = {() => router.back()}>
            <Ionicons name = "arrow-back" size={24} color= "#fff"/>
        </TouchableOpacity>
    )
}

// Private Helper component
function ProfileNetworkToggleIcon() {
    const isDevnet = useWalletStore((store) => store.isDevnet);
     
    return (
        <View style={[s.profileIconBox, isDevnet && s.profileIconBoxDevnet]}>
            <Ionicons
                name={isDevnet ? "flask" : "globe"}
                size={20}
                color={isDevnet ? "#F59E0B" : "#14F195"}
            />
        </View>
    )
}

export function ProfileNetworkToggleBox() {
    const isDevnet = useWalletStore((store) => store.isDevnet);
    const toggleNetwork = useWalletStore((store) => store.toggleNetwork);

    return (
        <View style={s.profileRow}>
            {/* Network state display & title */}
            <View style={s.profileRowLeft}>
                <ProfileNetworkToggleIcon />

                <View>
                    <Text style={s.profileLabel}>{isDevnet ? "Devnet" : "Mainnet"}</Text>
                    <Text style={s.profileSublabel}>
                        {isDevnet ? "Testing network (free SOL)" : "Production network"}
                    </Text>
                </View>
            </View>

            { /* Network Toggle Switch */}
            <Switch
                value={isDevnet}
                onValueChange={toggleNetwork}
                trackColor={{ true: "#14F195", false: "#2A2A35" }}
                thumbColor="#FFFFFF"
            />
        </View>
    )
}
