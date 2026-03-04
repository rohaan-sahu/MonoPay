import { StyleSheet } from "react-native";
import { fontWeight, palette, radius, spacing, typeScale } from "@mpay/styles/theme";

export const homeScreen = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: palette.backgroundLight,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 130,
    gap: spacing.md,
  },

  /* ── Header: avatar + search + chat ── */
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: palette.surfaceSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: palette.borderLight,
  },
  searchPlaceholder: {
    color: palette.textMuted,
    fontSize: typeScale.body,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── Balance ── */
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceValue: {
    color: palette.textPrimary,
    fontSize: 44,
    letterSpacing: -1.4,
    fontWeight: fontWeight.light,
  },
  currencyTag: {
    color: palette.textMuted,
    fontSize: typeScale.small,
    marginTop: 2,
  },
  balanceStatus: {
    color: palette.textMuted,
    fontSize: typeScale.small,
    marginTop: 6,
  },
  currencyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  currencyPillText: {
    color: palette.textPrimary,
    fontSize: typeScale.small,
    fontWeight: fontWeight.semibold,
  },

  /* ── Primary action buttons ── */
  primaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceLight,
    paddingVertical: 16,
  },
  primaryButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonLabel: {
    color: palette.textPrimary,
    fontSize: typeScale.body,
    fontWeight: fontWeight.medium,
  },

  /* ── Quick Access ── */
  quickAccessHeader: {
    color: palette.textPrimary,
    fontSize: typeScale.title,
    letterSpacing: -0.4,
    fontWeight: fontWeight.medium,
  },
  quickAccessRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickAccessItem: {
    alignItems: "center",
    gap: spacing.xs,
  },
  quickAccessCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.surfaceLight,
    borderWidth: 1,
    borderColor: palette.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  quickAccessLabel: {
    color: palette.textMuted,
    fontSize: typeScale.small,
  },

  /* ── Transactions section ── */
  txSection: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceLight,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  txHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    color: palette.textPrimary,
    fontSize: typeScale.title,
    letterSpacing: -0.4,
    fontWeight: fontWeight.medium,
  },
  viewAll: {
    color: palette.textMuted,
    fontSize: typeScale.small,
  },
  activityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  txAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  txAvatarText: {
    color: palette.textSecondary,
    fontSize: typeScale.small,
    fontWeight: fontWeight.semibold,
  },
  activityName: {
    color: palette.textPrimary,
    fontSize: typeScale.body,
    fontWeight: fontWeight.medium,
  },
  activityMeta: {
    color: palette.textMuted,
    fontSize: typeScale.small,
    marginTop: 2,
  },
  activityAmountOut: {
    color: palette.textPrimary,
    fontSize: typeScale.body,
    fontWeight: fontWeight.semibold,
  },
  activityAmountIn: {
    color: palette.textPrimary,
    fontSize: typeScale.body,
    fontWeight: fontWeight.semibold,
  },
});
