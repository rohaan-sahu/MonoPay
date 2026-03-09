import { StyleSheet } from "react-native";
import { fontWeight, palette, radius, spacing, typeScale } from "@mpay/styles/theme";

export const chatScreen = StyleSheet.create({
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
  subtitle: {
    color: palette.textSecondary,
    fontSize: typeScale.body,
    lineHeight: 22
  },
  row: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceLight,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: palette.borderLight
  },
  avatarText: {
    color: palette.textPrimary,
    fontWeight: fontWeight.semibold,
    fontSize: typeScale.body
  },
  name: {
    color: palette.textPrimary,
    fontSize: typeScale.body,
    fontWeight: fontWeight.medium
  },
  meta: {
    color: palette.textMuted,
    marginTop: 2,
    fontSize: typeScale.small
  },
  amount: {
    color: palette.textPrimary,
    fontWeight: fontWeight.semibold,
    fontSize: typeScale.body
  }
});
