import { StyleSheet } from "react-native";
import { fontWeight, palette, radius, spacing, typeScale } from "@mpay/styles/theme";

export const authFormScreen = StyleSheet.create({
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
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: palette.borderLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    backgroundColor: palette.surfaceLight
  },
  backLabel: {
    color: palette.textPrimary,
    fontSize: 24,
    lineHeight: 24
  },
  heading: {
    color: palette.textPrimary,
    fontSize: typeScale.displayLg,
    lineHeight: 42,
    letterSpacing: -1.1,
    fontWeight: fontWeight.light,
    marginBottom: spacing.xs
  },
  headingAccent: {
    color: palette.textMuted
  },
  subtitle: {
    color: palette.textSecondary,
    fontSize: typeScale.body,
    lineHeight: 23,
    marginBottom: spacing.xl
  },
  formCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceLight,
    padding: spacing.md,
    gap: spacing.md
  },
  fieldLabel: {
    color: palette.textPrimary,
    fontSize: typeScale.small,
    marginBottom: spacing.xs,
    fontWeight: fontWeight.medium
  },
  input: {
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceSoft,
    color: palette.textPrimary,
    paddingHorizontal: 14,
    fontSize: typeScale.body
  },
  tip: {
    color: palette.textSecondary,
    fontSize: typeScale.tiny,
    lineHeight: 16
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
  actionButtonDisabled: {
    opacity: 0.45
  },
  footerText: {
    color: palette.textSecondary,
    textAlign: "center",
    marginTop: spacing.md,
    fontSize: typeScale.small
  },
  footerLink: {
    color: palette.textPrimary,
    fontWeight: fontWeight.semibold
  }
});
