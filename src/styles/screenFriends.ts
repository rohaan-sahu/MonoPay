import { StyleSheet } from "react-native";

export const friendsScreenStyles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  friendsSafe: {
    flex: 1,
    backgroundColor: "#65d497",
  },
  friendsHeaderContainer:{
    flexDirection: 'row',
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  friendsListContainer:{
    flexDirection: 'row',
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  friendsMessageLogo:{
    flexDirection: 'row',
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  friendsItem: {
    backgroundColor: '#35c98462',
    padding: 2,
    marginVertical: 2,
  },
  friendsHeader: {
    fontSize: 22,
    padding: 5,
    backgroundColor: '#43d97a83',
  },
  friendsTitle: {
    fontSize: 16,
    padding: 5,
  },
});
