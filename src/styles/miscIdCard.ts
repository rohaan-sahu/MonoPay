import { StyleSheet } from "react-native";

export const idCardStyles = StyleSheet.create({
  idCardBox: {
    flex: 1,
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    margin: 30,
    gap: 12,
},
  idCardIconBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
},
  idCardImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    resizeMode: "cover",
},
  idCardQR: {
    width: 20,
    height: 20,
    backgroundColor: "#ffffff",
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "#155d26",
    justifyContent: "center",
    alignItems: "center",
},
  idCardName: {
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
},
  idCardAddressBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    backgroundColor: "#f0f0f5",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
},
  idCardAddress: {
    flex: 1,
    fontSize: 12,
    color: "#0a0a1a",
},
 idCardAddressCopy: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
},
  idCardVerified: {
    width: 18,
    height: 18,
}
});