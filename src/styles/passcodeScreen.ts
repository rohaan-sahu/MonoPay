import { StyleSheet } from "react-native";
import { fontWeight, palette, radius, spacing, typeScale } from "@mpay/styles/theme";

export const passcodeScreen = StyleSheet.create({
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
    marginBottom: spacing.sm
  },
  subtitle: {
    color: palette.textSecondary,
    fontSize: typeScale.body,
    lineHeight: 23,
    marginBottom: spacing.xl
  },
  inputLabel: {
    color: palette.textPrimary,
    fontSize: typeScale.small,
    marginBottom: spacing.xs,
    fontWeight: fontWeight.medium
  },
  input: {
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceSoft,
    color: palette.textPrimary,
    paddingHorizontal: 14,
    fontSize: typeScale.body,
    letterSpacing: 5
  },
  fieldSpacing: {
    marginBottom: spacing.md
  },
  hint: {
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
  }
});
