import { StyleSheet } from "react-native";
import { fontWeight, palette, radius, spacing, typeScale } from "@mpay/styles/theme";

export const transactionsScreen = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: palette.backgroundLight,
  },

  /* ── Header ── */
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  heading: {
    color: palette.textPrimary,
    fontSize: typeScale.displayMd,
    letterSpacing: -0.7,
    fontWeight: fontWeight.bold,
  },

  /* ── Search + Filter ── */
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: palette.surfaceLight,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    color: palette.textPrimary,
    fontSize: typeScale.body,
    padding: 0,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonActive: {
    borderColor: palette.textPrimary,
    backgroundColor: palette.surfaceSoft,
  },

  /* ── Filter chips ── */
  filterChipRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceLight,
  },
  filterChipActive: {
    borderColor: palette.textPrimary,
    backgroundColor: palette.textPrimary,
  },
  filterChipText: {
    color: palette.textSecondary,
    fontSize: typeScale.small,
    fontWeight: fontWeight.medium,
  },
  filterChipTextActive: {
    color: palette.white,
  },

  /* ── Divider ── */
  dividerRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  dividerLabel: {
    color: palette.textSecondary,
    fontSize: typeScale.body,
    fontWeight: fontWeight.medium,
  },
  dividerLine: {
    height: 1,
    backgroundColor: palette.borderLight,
  },

  /* ── List ── */
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },

  /* ── Transaction row ── */
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: palette.textSecondary,
    fontSize: typeScale.small,
    fontWeight: fontWeight.semibold,
  },
  rowInfo: {
    flex: 1,
  },
  name: {
    color: palette.textPrimary,
    fontSize: typeScale.body,
    fontWeight: fontWeight.medium,
  },
  date: {
    color: palette.textMuted,
    fontSize: typeScale.small,
    marginTop: 2,
  },
  amount: {
    color: palette.textPrimary,
    fontSize: typeScale.body,
    fontWeight: fontWeight.semibold,
  },
});
