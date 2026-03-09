import { StyleSheet } from "react-native";
import { fontWeight, palette, radius, spacing, typeScale } from "@mpay/styles/theme";

export const scanScreen = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: palette.backgroundLight,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 120
  },
  heading: {
    color: palette.textPrimary,
    fontSize: typeScale.displayMd,
    letterSpacing: -0.7,
    lineHeight: 34,
    fontWeight: fontWeight.light
  },
  subtitle: {
    color: palette.textSecondary,
    fontSize: typeScale.body,
    lineHeight: 23,
    marginTop: spacing.xs,
    marginBottom: spacing.xl
  },
  scanBox: {
    height: 330,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg
  },
  scanFrame: {
    width: 220,
    height: 220,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: "#1f2937",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.surfaceSoft
  },
  scanIcon: {
    fontSize: 44,
    marginBottom: spacing.xs,
    color: palette.textPrimary
  },
  scanHint: {
    color: palette.textSecondary,
    fontSize: typeScale.small,
    textAlign: "center",
    maxWidth: 170,
    lineHeight: 18
  },
  actionButton: {
    height: 58,
    borderRadius: radius.md,
    backgroundColor: palette.panelDark,
    alignItems: "center",
    justifyContent: "center"
  },
  actionButtonText: {
    color: palette.accentLight,
    fontSize: typeScale.body,
    fontWeight: fontWeight.bold
  }
});
