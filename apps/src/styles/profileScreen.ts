import { StyleSheet } from "react-native";
import { fontWeight, palette, radius, spacing, typeScale } from "@mpay/styles/theme";

export const profileScreen = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: palette.backgroundLight
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 120,
    gap: spacing.md
  },
  heading: {
    color: palette.textPrimary,
    fontSize: typeScale.displayMd,
    letterSpacing: -0.7,
    lineHeight: 34,
    fontWeight: fontWeight.light
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceLight,
    padding: spacing.md,
    gap: spacing.sm
  },
  label: {
    color: palette.textMuted,
    fontSize: typeScale.tiny,
    letterSpacing: 1
  },
  value: {
    color: palette.textPrimary,
    fontSize: typeScale.title,
    letterSpacing: -0.5,
    fontWeight: fontWeight.medium
  },
  row: {
    borderTopWidth: 1,
    borderTopColor: palette.borderSoft,
    paddingTop: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  rowLabel: {
    color: palette.textMuted,
    fontSize: typeScale.small
  },
  rowValue: {
    color: palette.textSecondary,
    fontSize: typeScale.small
  },
  buttonPrimary: {
    height: 56,
    borderRadius: radius.md,
    backgroundColor: palette.panelDark,
    alignItems: "center",
    justifyContent: "center"
  },
  buttonPrimaryText: {
    color: palette.accentLight,
    fontSize: typeScale.body,
    fontWeight: fontWeight.bold
  },
  buttonSecondary: {
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderLight,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.surfaceLight
  },
  buttonSecondaryText: {
    color: palette.textPrimary,
    fontSize: typeScale.body,
    fontWeight: fontWeight.semibold
  },
  buttonDanger: {
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.35)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(220,38,38,0.06)"
  },
  buttonDangerText: {
    color: palette.danger,
    fontSize: typeScale.body,
    fontWeight: fontWeight.semibold
  }
});
