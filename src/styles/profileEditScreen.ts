import { StyleSheet } from "react-native";
import { fontWeight, palette, radius, spacing, typeScale } from "@mpay/styles/theme";

export const profileEditScreen = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: palette.backgroundLight,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 120,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    color: palette.textPrimary,
    fontSize: typeScale.displayMd,
    letterSpacing: -0.7,
    lineHeight: 34,
    fontWeight: fontWeight.light,
  },
  helperText: {
    color: palette.textSecondary,
    fontSize: typeScale.small,
    lineHeight: 20,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceLight,
    padding: spacing.md,
    gap: spacing.sm,
  },
  fieldLabel: {
    color: palette.textMuted,
    fontSize: typeScale.tiny,
    letterSpacing: 0.4,
  },
  input: {
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: "#fafafa",
    paddingHorizontal: spacing.md,
    color: palette.textPrimary,
    fontSize: typeScale.body,
  },
  tagWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: "#fafafa",
    height: 54,
    paddingHorizontal: spacing.md,
  },
  tagPrefix: {
    color: palette.textPrimary,
    fontSize: typeScale.body,
    fontWeight: fontWeight.medium,
    marginRight: 2,
  },
  tagInput: {
    flex: 1,
    color: palette.textPrimary,
    fontSize: typeScale.body,
    height: "100%",
  },
  hint: {
    color: palette.textMuted,
    fontSize: typeScale.tiny,
  },
  errorText: {
    color: palette.danger,
    fontSize: typeScale.small,
  },
  buttonPrimary: {
    height: 56,
    borderRadius: radius.md,
    backgroundColor: palette.panelDark,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPrimaryText: {
    color: palette.accentLight,
    fontSize: typeScale.body,
    fontWeight: fontWeight.bold,
  },
});
