import { StyleSheet } from "react-native";
import { fontWeight, palette, radius, spacing, typeScale } from "@mpay/styles/theme";

export const homeScreen = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: palette.backgroundLight
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 130,
    gap: spacing.md
  },
  greeting: {
    color: palette.textMuted,
    fontSize: typeScale.small,
    letterSpacing: 1.2
  },
  title: {
    color: palette.textPrimary,
    fontSize: typeScale.displayMd,
    lineHeight: 34,
    letterSpacing: -0.7,
    fontWeight: fontWeight.light
  },
  balanceCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceLight,
    padding: spacing.lg,
    gap: spacing.md
  },
  balanceLabel: {
    color: palette.textMuted,
    fontSize: typeScale.small
  },
  balanceValue: {
    color: palette.textPrimary,
    fontSize: 44,
    letterSpacing: -1.4,
    fontWeight: fontWeight.light
  },
  currencyTag: {
    color: palette.textSecondary,
    fontSize: typeScale.small,
    marginTop: 4
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end"
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  quickAction: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceSoft,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 4
  },
  quickActionIcon: {
    fontSize: 18,
    color: palette.textPrimary
  },
  quickActionLabel: {
    color: palette.textSecondary,
    fontSize: typeScale.small,
    fontWeight: fontWeight.semibold
  },
  sectionTitle: {
    color: palette.textPrimary,
    fontSize: typeScale.title,
    letterSpacing: -0.4,
    fontWeight: fontWeight.medium
  },
  activityCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceLight,
    padding: spacing.md,
    gap: spacing.md
  },
  activityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  activityName: {
    color: palette.textPrimary,
    fontSize: typeScale.body,
    fontWeight: fontWeight.medium
  },
  activityMeta: {
    color: palette.textMuted,
    fontSize: typeScale.small,
    marginTop: 2
  },
  activityAmountOut: {
    color: palette.textPrimary,
    fontSize: typeScale.body,
    fontWeight: fontWeight.semibold
  },
  activityAmountIn: {
    color: palette.textPrimary,
    fontSize: typeScale.body,
    fontWeight: fontWeight.semibold
  }
});
