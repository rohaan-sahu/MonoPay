import { StyleSheet } from "react-native";

export const homeScreenStyles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
  safe: {
    flex: 1,
    backgroundColor: "#a2a2bd",
  },
  btnContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 1,
    backgroundColor: "#b5b5be",
    padding: 24,
    paddingHorizontal: 16,
  },
  scanBtn: {
    flex: 1,
    backgroundColor: "#27996a",
    paddingVertical: 16,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    width: 54,
    margin: 10
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: "#0D0D12",
    fontWeight: "600",
    fontSize: 16,
  },
  cameraContainer: StyleSheet.absoluteFillObject,
  camera: StyleSheet.absoluteFillObject,
  inputContainer: {
    backgroundColor: "#16161D",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#2A2A35",
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: {
    color: "#FFFFFF",
    fontSize: 15,
    paddingVertical: 14,
  },
});
