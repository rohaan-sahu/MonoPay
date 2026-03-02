import { View,TextInput } from "react-native";
import { homeScreenStyles } from "@/styles/screenHome";
import { searchBarStyles as s } from "@/styles/miscSearchBars";
import { Ionicons } from "@expo/vector-icons";

interface Prop {
    search: string;
    setSearch: (addr: string) => void;
    placeHolder: string;
}

export function SearchBarRound({search,setSearch,placeHolder}:Prop) {
    return (
        <View style={s.simpleRoundSearchBar}>
            <Ionicons name="search" size={20} color="#c3c3d1" />
            <TextInput
                style={s.searchBarInput001}
                placeholder={placeHolder} 
                placeholderTextColor="#6B7280"
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                autoCorrect={false}
            />
        </View>
    )
    
}

export function SearchBarRect({search,setSearch,placeHolder}:Prop) {
    return (
        <View style={s.simpleRectSearchBar}>
            <Ionicons name="search" size={20} color="#c3c3d1" />
            <TextInput
                style={s.searchBarInput001}
                placeholder={placeHolder} 
                placeholderTextColor="#6B7280"
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                autoCorrect={false}
            />
        </View>
    )
    
}