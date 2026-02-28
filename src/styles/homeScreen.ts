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
  bannerContainer: {
    width: "100%",
    height: 200,
    overflow: "hidden",
  },
  btnContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fcfcfc",
    padding: 24,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: "#e7e7e742",
    fontWeight: "600",
    fontSize: 16,
  },
  cameraContainer: StyleSheet.absoluteFillObject,
  camera: StyleSheet.absoluteFillObject,
  headerContainer:{
    flexDirection: 'row',
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  homeButtonView:{
    alignItems: 'center',
    gap: -4
  },
  homeButtonText: {
    fontSize: 12,
    color: "#000000",
    textAlign: "center",
  },idCard: {

  },
  idCardBtn: {
    backgroundColor: "#58cb9b",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 34,
    width: 34
  },
  idCardBtnText: {
    fontSize: 12,
    color: "#fff",
  },
  searchBar: {
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
  input: {
    color: "#FFFFFF",
    fontSize: 14,
    paddingVertical: 6,
  },
  scanBtn: {
    flex: 1,
    backgroundColor: "#58cb9b",
    paddingVertical: 16,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    width: 54,
    margin: 10
  },
});
