import { StyleSheet } from "react-native";

export const qrScreenStyles = StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: "#65d497",
    alignItems: "center",
    justifyContent: "center",
  },
  QrPageCardBox: {
    flex: 1,
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    margin: 30,
    gap: 12,
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
  QrPageMessageLogo:{
    flexDirection: 'row',
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 16,
    paddingVertical: 4,
  }
});