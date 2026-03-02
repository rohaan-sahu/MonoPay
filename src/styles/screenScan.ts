import { StyleSheet } from "react-native";

export const scanScreenStyles = StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraContainer: StyleSheet.absoluteFillObject,
  camera: StyleSheet.absoluteFillObject,
  shutterContainer: {
    position: "absolute",
    bottom: 44,
    left: 0,
    width: "100%",
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 30,
  },
  shutterBtn: {
    backgroundColor: "transparent",
    borderWidth: 5,
    borderColor: "white",
    width: 85,
    height: 85,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 50,
  },
  backButton: {
    backgroundColor: "#9945FF", paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 10, marginTop: 16,
  },
  backButtonText: { color: "#fff", fontWeight: "bold" },
});