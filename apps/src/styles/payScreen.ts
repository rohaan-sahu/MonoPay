import { StyleSheet } from "react-native";
import { fontWeight, palette, radius, spacing, typeScale } from "@mpay/styles/theme";

export const payScreen = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: palette.backgroundLight,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 120,
  },

  /* ── Header ── */
  heading: {
    color: palette.textPrimary,
    fontSize: typeScale.displayMd,
    letterSpacing: -0.7,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xl,
  },

  /* ── Amount display ── */
  amountSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  amountPrefix: {
    color: palette.textMuted,
    fontSize: typeScale.displayMd,
    fontWeight: fontWeight.light,
    marginTop: 8,
    marginRight: 4,
  },
  amountValue: {
    color: palette.textPrimary,
    fontSize: 56,
    fontWeight: fontWeight.light,
    letterSpacing: -2,
    minWidth: 40,
  },

  /* ── Token selector ── */
  tokenRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  tokenChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceLight,
  },
  tokenChipActive: {
    borderColor: palette.textPrimary,
    backgroundColor: palette.textPrimary,
  },
  tokenChipText: {
    color: palette.textSecondary,
    fontSize: typeScale.small,
    fontWeight: fontWeight.semibold,
  },
  tokenChipTextActive: {
    color: palette.white,
  },
  balanceHint: {
    textAlign: "center",
    color: palette.textMuted,
    fontSize: typeScale.small,
    marginBottom: spacing.lg,
  },
  balanceError: {
    textAlign: "center",
    color: palette.textMuted,
    fontSize: typeScale.small,
    marginTop: -spacing.md,
    marginBottom: spacing.lg,
  },

  /* ── Keypad ── */
  keypad: {
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
  },
  keypadKey: {
    width: 72,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: palette.surfaceLight,
    borderWidth: 1,
    borderColor: palette.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  keypadKeyText: {
    color: palette.textPrimary,
    fontSize: typeScale.title,
    fontWeight: fontWeight.medium,
  },

  /* ── Recipient ── */
  sectionLabel: {
    color: palette.textSecondary,
    fontSize: typeScale.small,
    fontWeight: fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  recipientRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  recipientInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: palette.surfaceLight,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  recipientTextInput: {
    flex: 1,
    color: palette.textPrimary,
    fontSize: typeScale.body,
    padding: 0,
  },
  scanButton: {
    width: 50,
    height: 50,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  searchState: {
    color: palette.textMuted,
    fontSize: typeScale.tiny,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  searchError: {
    color: palette.danger,
    fontSize: typeScale.tiny,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  suggestionsCard: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceLight,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  suggestionRow: {
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  suggestionTag: {
    color: palette.textPrimary,
    fontSize: typeScale.small,
    fontWeight: fontWeight.semibold,
  },
  suggestionMeta: {
    color: palette.textMuted,
    fontSize: typeScale.tiny,
  },
  previewCard: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    gap: 4,
  },
  previewName: {
    color: palette.textPrimary,
    fontSize: typeScale.small,
    fontWeight: fontWeight.semibold,
  },
  previewMeta: {
    color: palette.textMuted,
    fontSize: typeScale.tiny,
  },
  statusError: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.32)",
    backgroundColor: "rgba(220,38,38,0.06)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  statusErrorText: {
    color: palette.danger,
    fontSize: typeScale.small,
    fontWeight: fontWeight.medium,
  },
  statusSuccess: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    gap: 8,
  },
  statusSuccessTitle: {
    color: palette.textPrimary,
    fontSize: typeScale.small,
    fontWeight: fontWeight.semibold,
  },
  statusSuccessMeta: {
    color: palette.textMuted,
    fontSize: typeScale.tiny,
  },
  statusLinkButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: palette.borderLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusLinkText: {
    color: palette.textSecondary,
    fontSize: typeScale.tiny,
    fontWeight: fontWeight.medium,
  },

  /* ── Recent recipients ── */
  recentRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  recentItem: {
    alignItems: "center",
    gap: 4,
    width: 52,
  },
  recentAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  recentAvatarText: {
    color: palette.textSecondary,
    fontSize: typeScale.small,
    fontWeight: fontWeight.semibold,
  },
  recentName: {
    color: palette.textMuted,
    fontSize: typeScale.tiny,
  },

  /* ── Bottom pay button ── */
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 36,
    backgroundColor: palette.backgroundLight,
  },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 58,
    borderRadius: radius.md,
    backgroundColor: palette.panelDark,
  },
  payButtonDisabled: {
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.borderLight,
  },
  payButtonText: {
    color: palette.white,
    fontSize: typeScale.body,
    fontWeight: fontWeight.bold,
  },
  payButtonTextDisabled: {
    color: palette.textMuted,
  },
});
