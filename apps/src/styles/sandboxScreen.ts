import { StyleSheet } from "react-native";
import { fontWeight, palette, radius, spacing, typeScale } from "@mpay/styles/theme";

export const sandboxScreen = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: palette.backgroundLight
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 180,
    gap: spacing.md
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.borderLight,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.surfaceLight
  },
  backButtonText: {
    color: palette.textPrimary,
    fontSize: 19,
    fontWeight: fontWeight.medium
  },
  headingWrap: {
    flex: 1
  },
  heading: {
    color: palette.textPrimary,
    fontSize: typeScale.displayMd,
    lineHeight: 34,
    letterSpacing: -0.6,
    fontWeight: fontWeight.light
  },
  subtitle: {
    marginTop: 2,
    color: palette.textMuted,
    fontSize: typeScale.small
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceLight,
    padding: spacing.md,
    gap: spacing.sm
  },
  cardTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: fontWeight.semibold
  },
  cardMeta: {
    color: palette.textSecondary,
    fontSize: typeScale.small,
    lineHeight: 20
  },
  label: {
    color: palette.textMuted,
    fontSize: typeScale.tiny,
    letterSpacing: 0.5
  },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: palette.borderLight,
    borderRadius: radius.sm,
    height: 46,
    paddingHorizontal: 12,
    color: palette.textPrimary,
    fontSize: typeScale.body,
    backgroundColor: palette.surfaceSoft
  },
  textArea: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: palette.borderLight,
    borderRadius: radius.sm,
    minHeight: 78,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: palette.textPrimary,
    fontSize: typeScale.body,
    backgroundColor: palette.surfaceSoft,
    textAlignVertical: "top"
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm
  },
  rowItem: {
    flex: 1
  },
  buttonDark: {
    marginTop: 6,
    height: 46,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.panelDark
  },
  buttonDarkDisabled: {
    opacity: 0.45
  },
  buttonDarkText: {
    color: palette.textOnDark,
    fontSize: typeScale.body,
    fontWeight: fontWeight.semibold
  },
  buttonLight: {
    marginTop: 6,
    height: 42,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.borderLight,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.surfaceLight
  },
  buttonLightText: {
    color: palette.textPrimary,
    fontSize: typeScale.small,
    fontWeight: fontWeight.semibold
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap"
  },
  badge: {
    borderWidth: 1,
    borderColor: palette.borderLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  badgeActive: {
    backgroundColor: palette.panelDark,
    borderColor: palette.panelDark
  },
  badgeText: {
    color: palette.textSecondary,
    fontSize: typeScale.tiny,
    fontWeight: fontWeight.medium
  },
  badgeTextActive: {
    color: palette.textOnDark
  },
  resultBox: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.borderLight,
    padding: 10,
    backgroundColor: palette.surfaceSoft
  },
  resultText: {
    color: palette.textSecondary,
    fontSize: typeScale.small,
    lineHeight: 20
  },
  errorText: {
    color: palette.danger,
    fontSize: typeScale.small,
    lineHeight: 18
  },
  logPanel: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: "#0f0f10",
    padding: spacing.md,
    gap: 7
  },
  logTitle: {
    color: palette.textOnDark,
    fontSize: typeScale.small,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.3
  },
  logItem: {
    color: palette.textOnDarkMuted,
    fontSize: typeScale.tiny,
    lineHeight: 16
  }
});
