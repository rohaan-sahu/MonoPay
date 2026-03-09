import { StyleSheet, Text, View } from "react-native";
import { fontWeight, palette, typeScale } from "@mpay/styles/theme";

type MonopayMarkProps = {
  subtitle?: string;
  light?: boolean;
};

export function MonopayMark({ subtitle = "Private Social Payments", light = true }: MonopayMarkProps) {
  const titleColor = light ? palette.textOnDark : palette.textPrimary;
  const accentColor = light ? "rgba(255,255,255,0.72)" : "rgba(17,17,17,0.68)";
  const subColor = light ? palette.textOnDarkMuted : palette.textSecondary;

  return (
    <View>
      <Text style={[styles.title, { color: titleColor }]}>Mono<Text style={[styles.titleAccent, { color: accentColor }]}>Pay</Text></Text>
      <Text style={[styles.subtitle, { color: subColor }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typeScale.displayMd,
    letterSpacing: -1,
    fontWeight: fontWeight.light
  },
  titleAccent: {
    fontWeight: fontWeight.light
  },
  subtitle: {
    marginTop: 4,
    fontSize: typeScale.small,
    letterSpacing: 0.4
  }
});
