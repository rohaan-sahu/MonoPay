import { StyleSheet, View } from "react-native";

type GradientBackdropProps = {
  colorA?: string;
  colorB?: string;
  darkOverlay?: boolean;
};

export function GradientBackdrop({
  colorA = "rgba(0,0,0,0.06)",
  colorB = "rgba(0,0,0,0.03)",
  darkOverlay = false
}: GradientBackdropProps) {
  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <View style={[styles.orbLarge, { backgroundColor: colorA }]} />
      <View style={[styles.orbMedium, { backgroundColor: colorB }]} />
      {darkOverlay ? <View style={styles.darkOverlay} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject
  },
  orbLarge: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    right: -90,
    top: -70
  },
  orbMedium: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    left: -80,
    bottom: -50
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.14)"
  }
});
