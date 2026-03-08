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

  /* ── Balance card (dark gradient) ── */
  balanceCard: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    overflow: "hidden",
    padding: spacing.lg,
  },
  balanceCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: typeScale.small,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceValue: {
    color: palette.white,
    fontSize: 40,
    letterSpacing: -1.4,
    fontWeight: fontWeight.light,
  },
  balanceStatusLight: {
    color: "rgba(255,255,255,0.5)",
    fontSize: typeScale.small,
    marginTop: 6,
  },
  currencyPillDark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  currencyPillDarkText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: typeScale.small,
    fontWeight: fontWeight.semibold,
  },

  /* ── Balance toggle ── */
  balanceTouchable: {
    flexDirection: "row",
    alignItems: "center",
  },
  eyeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── Card action buttons (inside balance card) ── */
  cardActionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  cardActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 14,
  },
  cardActionLabel: {
    color: palette.white,
    fontSize: typeScale.body,
    fontWeight: fontWeight.medium,
  },

  /* ── Quick Access ── */
  quickAccessRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xl,
    marginTop: spacing.xs,
  },
  quickAccessItem: {
    alignItems: "center",
    gap: spacing.xs,
  },
  quickAccessCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: palette.surfaceLight,
    borderWidth: 1,
    borderColor: palette.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  quickAccessLabel: {
    color: palette.textSecondary,
    fontSize: typeScale.small,
    fontWeight: fontWeight.medium,
  },

  /* ── Friends section ── */
  friendsSection: {
    gap: spacing.sm,
  },
  friendsSectionTitle: {
    color: palette.textPrimary,
    fontSize: typeScale.body,
    fontWeight: fontWeight.semibold,
  },
  friendsScroll: {
    gap: spacing.md,
  },
  friendItem: {
    alignItems: "center",
    gap: spacing.xs,
    width: 64,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  friendAvatarText: {
    color: palette.textSecondary,
    fontSize: typeScale.small,
    fontWeight: fontWeight.semibold,
  },
  friendName: {
    color: palette.textMuted,
    fontSize: typeScale.tiny,
    textAlign: "center",
  },

  /* ── Transactions section ── */
  txSection: {
    marginTop: spacing.sm,
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
  viewAllButton: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  viewAllText: {
    color: palette.textSecondary,
    fontSize: typeScale.small,
    fontWeight: fontWeight.medium,
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
