import { StyleSheet, View } from "react-native";

/**
 * Dark gradient backdrop for the balance card.
 * Uses layered orbs to simulate a dark charcoal/gunmetal gradient
 * with subtle steel-blue accents.
 */
export function BalanceCardGradient() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Base — deep charcoal */}
      <View style={styles.base} />
      {/* Steel-blue accent — top-right */}
      <View style={styles.orbTopRight} />
      {/* Gunmetal accent — bottom-left */}
      <View style={styles.orbBottomLeft} />
      {/* Subtle silver highlight — center-right */}
      <View style={styles.highlight} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1a1d21",
  },
  orbTopRight: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    top: -70,
    right: -50,
    backgroundColor: "rgba(90,105,130,0.35)",
  },
  orbBottomLeft: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    bottom: -60,
    left: -40,
    backgroundColor: "rgba(60,68,80,0.4)",
  },
  highlight: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    top: 10,
    right: 40,
    backgroundColor: "rgba(140,155,175,0.1)",
  },
});
