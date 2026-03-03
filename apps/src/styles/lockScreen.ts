import { StyleSheet } from "react-native";
import { fontWeight, palette, radius, spacing, typeScale } from "@mpay/styles/theme";

export const lockScreen = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: palette.backgroundDark
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    justifyContent: "space-between"
  },
  topBlock: {
    alignItems: "center",
    marginTop: spacing.xl,
    gap: spacing.sm
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: palette.borderDark
  },
  avatarText: {
    color: palette.textOnDark,
    fontSize: typeScale.title,
    fontWeight: fontWeight.semibold
  },
  heading: {
    color: palette.textOnDark,
    fontSize: typeScale.displayMd,
    lineHeight: 34,
    letterSpacing: -0.7,
    fontWeight: fontWeight.light,
    textAlign: "center"
  },
  subtitle: {
    color: palette.textOnDarkMuted,
    fontSize: typeScale.body,
    textAlign: "center"
  },
  input: {
    height: 58,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderDark,
    backgroundColor: "rgba(255,255,255,0.06)",
    color: palette.textOnDark,
    paddingHorizontal: 14,
    fontSize: typeScale.body,
    letterSpacing: 6,
    textAlign: "center"
  },
  error: {
    color: "#fca5a5",
    textAlign: "center",
    marginTop: spacing.sm,
    fontSize: typeScale.small
  },
  unlockButton: {
    marginTop: spacing.md,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: palette.accentLight,
    alignItems: "center",
    justifyContent: "center"
  },
  unlockButtonText: {
    color: palette.textPrimary,
    fontSize: typeScale.body,
    fontWeight: fontWeight.bold
  },
  footerActions: {
    gap: spacing.sm
  },
  secondaryButton: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderDark,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)"
  },
  secondaryButtonText: {
    color: palette.textOnDark,
    fontSize: typeScale.small,
    fontWeight: fontWeight.semibold
  }
});
