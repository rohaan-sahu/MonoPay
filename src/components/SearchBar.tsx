import { View,TextInput } from "react-native";
import { homeScreenStyles as s } from "@/styles/homeScreen";
import { Ionicons } from "@expo/vector-icons";

interface Prop {
    search: string,
    setSearch: (addr: string) => void
}

export default function SearchBar({search,setSearch}:Prop) {
    return (
        <View style={s.searchBar}>
            <Ionicons name="search" size={20} color="#c3c3d1" />
            <TextInput
                style={s.input}
                placeholder="find every one here..." 
                placeholderTextColor="#6B7280"
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                autoCorrect={false}
            />
        </View>
    )
    
}