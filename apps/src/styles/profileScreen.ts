import { Platform, StyleSheet } from "react-native";
import { fontWeight, palette, radius, spacing, typeScale } from "@mpay/styles/theme";

const displayFont = Platform.select({
  ios: "Bricolage Grotesque",
  android: "sans-serif-light",
  default: "sans-serif",
});

const bodyFont = Platform.select({
  ios: "Inter",
  android: "sans-serif",
  default: "sans-serif",
});

export const profileScreen = StyleSheet.create({
  /* ═══════════════════════════════════════════
     PAGE
     ═══════════════════════════════════════════ */
  page: {
    flex: 1,
    backgroundColor: palette.backgroundLight,
  },
  content: {
    paddingBottom: 120,
  },

  /* ═══════════════════════════════════════════
     HEADER CARD
     ═══════════════════════════════════════════ */
  headerCard: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: spacing.lg,
  },
  headerTopRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 12,
  },
  chatIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.panelDark,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.panelDark,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: fontWeight.semibold,
    fontFamily: bodyFont,
  },
  headerName: {
    color: palette.textPrimary,
    fontSize: 22,
    fontWeight: fontWeight.medium,
    fontFamily: displayFont,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  tagPill: {
    backgroundColor: palette.surfaceSoft,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tagPillText: {
    color: palette.textSecondary,
    fontSize: 13,
    fontWeight: fontWeight.medium,
    fontFamily: bodyFont,
  },
  pointsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: palette.panelDark,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pointsPillText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: fontWeight.bold,
    fontFamily: bodyFont,
  },

  /* ═══════════════════════════════════════════
     TIER BAR
     ═══════════════════════════════════════════ */
  tierCard: {
    width: "100%",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceLight,
    padding: 16,
    marginBottom: 16,
  },
  tierTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: palette.panelDark,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tierBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: fontWeight.bold,
    fontFamily: bodyFont,
  },
  tierLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tierLinkText: {
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: fontWeight.medium,
    fontFamily: bodyFont,
  },
  tierTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.surfaceSoft,
    marginBottom: 8,
    overflow: "hidden" as const,
  },
  tierProgress: {
    height: 6,
    borderRadius: 3,
  },
  tierLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tierLabel: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: fontWeight.medium,
    fontFamily: bodyFont,
  },
  tierLabelActive: {
    color: palette.textPrimary,
    fontWeight: fontWeight.bold,
  },

  /* ═══════════════════════════════════════════
     QUICK ACTIONS
     ═══════════════════════════════════════════ */
  quickActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    width: "100%",
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  quickActionText: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    fontFamily: bodyFont,
  },

  /* ═══════════════════════════════════════════
     SEARCH BAR
     ═══════════════════════════════════════════ */
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: spacing.lg,
    marginTop: 24,
    marginBottom: 8,
    backgroundColor: palette.surfaceSoft,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchText: {
    color: palette.textMuted,
    fontSize: 14,
    fontFamily: bodyFont,
  },

  /* ═══════════════════════════════════════════
     SECTION GROUPS
     ═══════════════════════════════════════════ */
  sectionHeader: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1.2,
    textTransform: "uppercase" as const,
    fontFamily: bodyFont,
    marginTop: 20,
    marginBottom: 6,
    paddingHorizontal: spacing.lg,
  },
  sectionCard: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceLight,
    overflow: "hidden" as const,
  },

  /* ═══════════════════════════════════════════
     SETTING ROWS
     ═══════════════════════════════════════════ */
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 12,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  settingIconDanger: {
    backgroundColor: "rgba(220,38,38,0.08)",
  },
  settingContent: {
    flex: 1,
    justifyContent: "center",
  },
  settingContentCentered: {
    minHeight: 32,
  },
  settingLabel: {
    color: palette.textPrimary,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: fontWeight.medium,
    fontFamily: bodyFont,
  },
  settingLabelDanger: {
    color: palette.danger,
  },
  settingMeta: {
    color: palette.textMuted,
    fontSize: 11,
    fontFamily: bodyFont,
    marginTop: 1,
  },
  settingChevron: {
    marginLeft: 4,
  },

  /* ═══════════════════════════════════════════
     STATUS BADGES (reused for verification)
     ═══════════════════════════════════════════ */
  statusOk: {
    color: "#166534",
    fontSize: typeScale.small,
    fontWeight: fontWeight.medium,
    paddingHorizontal: spacing.lg,
    marginTop: 4,
  },
  statusError: {
    color: palette.danger,
    fontSize: typeScale.small,
    fontWeight: fontWeight.medium,
    paddingHorizontal: spacing.lg,
    marginTop: 4,
  },

  /* ═══════════════════════════════════════════
     SIGN OUT
     ═══════════════════════════════════════════ */
  signOutWrap: {
    marginHorizontal: spacing.lg,
    marginTop: 24,
  },
  buttonDanger: {
    height: 54,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.35)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(220,38,38,0.06)",
  },
  buttonDangerText: {
    color: palette.danger,
    fontSize: typeScale.body,
    fontWeight: fontWeight.semibold,
    fontFamily: bodyFont,
  },
});
