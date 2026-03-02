import { StyleSheet } from "react-native";

export const searchBarStyles = StyleSheet.create({
    simpleRoundSearchBar: {
        alignItems: "center",
        flexDirection: "row",
        flex: 1,
        gap: 6,
        backgroundColor: "#16161D",
        borderRadius: 35,
        borderWidth: 1,
        borderColor: "#2A2A35",
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    simpleRectSearchBar: {
        alignItems: "center",
        flexDirection: "row",
        flex: 1,
        gap: 6,
        backgroundColor: "#16161D",
        borderRadius: 5,
        borderWidth: 1,
        borderColor: "#2A2A35",
        paddingHorizontal: 16,
        paddingVertical: 4,
    },

    searchBarInput001: {
        color: "#FFFFFF",
        fontSize: 14,
        paddingVertical: 6,
    }
});