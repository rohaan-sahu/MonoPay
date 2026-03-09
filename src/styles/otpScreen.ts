import { StyleSheet } from "react-native";
import { fontWeight, palette, radius, spacing, typeScale } from "@mpay/styles/theme";

export const otpScreen = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: palette.backgroundLight
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    justifyContent: "space-between"
  },
  heading: {
    color: palette.textPrimary,
    fontSize: typeScale.displayLg,
    lineHeight: 42,
    letterSpacing: -1.1,
    fontWeight: fontWeight.light,
    marginBottom: spacing.xs
  },
  subtitle: {
    color: palette.textSecondary,
    fontSize: typeScale.body,
    lineHeight: 23,
    marginBottom: spacing.lg
  },
  hint: {
    color: palette.textPrimary,
    fontSize: typeScale.tiny,
    letterSpacing: 1.4,
    marginBottom: spacing.md,
    fontWeight: fontWeight.semibold
  },
  codeInput: {
    height: 62,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceSoft,
    color: palette.textPrimary,
    fontSize: 30,
    letterSpacing: 12,
    paddingHorizontal: 20,
    textAlign: "center"
  },
  helper: {
    color: palette.textSecondary,
    fontSize: typeScale.small,
    marginTop: spacing.sm
  },
  error: {
    color: palette.danger,
    fontSize: typeScale.small,
    marginTop: spacing.sm
  },
  actionPanel: {
    marginTop: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: palette.panelDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  actionPanelTextWrap: {
    flex: 1
  },
  actionPanelLabel: {
    color: "rgba(255,255,255,0.52)",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontSize: typeScale.tiny,
    marginBottom: 4
  },
  actionPanelTitle: {
    color: palette.textOnDark,
    fontSize: typeScale.title,
    letterSpacing: -0.5,
    fontWeight: fontWeight.light
  },
  actionButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: palette.accentLight,
    alignItems: "center",
    justifyContent: "center"
  },
  actionButtonText: {
    color: palette.textPrimary,
    fontSize: 28,
    lineHeight: 28,
    fontWeight: fontWeight.medium
  },
  secondaryButton: {
    height: 54,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: palette.borderLight,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.surfaceLight
  },
  secondaryButtonText: {
    color: palette.textPrimary,
    fontSize: typeScale.body,
    fontWeight: fontWeight.semibold
  }
});
