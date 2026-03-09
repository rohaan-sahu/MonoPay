import { StyleSheet, Text, View } from "react-native";
import { fontWeight, palette, radius, typeScale } from "@mpay/styles/theme";

type FeatureBadgeProps = {
  icon: string;
  title: string;
  description: string;
};

export function FeatureBadge({ icon, title, description }: FeatureBadgeProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "31%",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderDark,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: 12,
    paddingHorizontal: 10,
    minHeight: 112
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    marginBottom: 10
  },
  icon: {
    fontSize: 15,
    color: palette.textOnDark
  },
  title: {
    color: palette.textOnDark,
    fontWeight: fontWeight.semibold,
    fontSize: typeScale.small,
    marginBottom: 4
  },
  description: {
    color: palette.textOnDarkMuted,
    fontSize: typeScale.tiny,
    lineHeight: 15
  }
});
