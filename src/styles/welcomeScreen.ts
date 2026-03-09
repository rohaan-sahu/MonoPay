import { StyleSheet } from "react-native";
import { fontWeight, palette, radius, spacing, typeScale } from "@mpay/styles/theme";

export const welcomeScreen = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: palette.backgroundDark
  },
  heroImage: {
    flex: 1
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.48)"
  },
  heroVignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.22)"
  },
  imageContent: {
    flex: 1,
    paddingTop: 64,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    justifyContent: "space-between"
  },
  topBlock: {
    gap: spacing.md
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.14)",
    paddingBottom: spacing.md
  },
  iconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.34)",
    alignItems: "center",
    justifyContent: "center"
  },
  iconText: {
    color: palette.textOnDark,
    fontSize: 12,
    fontWeight: fontWeight.bold
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  avatars: {
    flexDirection: "row"
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.4)",
    marginLeft: -8
  },
  starRow: {
    flexDirection: "row",
    gap: 2,
    marginBottom: 2
  },
  starText: {
    color: palette.textOnDark,
    fontSize: 11
  },
  trustText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: typeScale.tiny,
    maxWidth: 160
  },
  middleBlock: {
    gap: spacing.md
  },
  pitch: {
    width: "84%",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.52)",
    paddingLeft: 12,
    color: "rgba(255,255,255,0.95)",
    fontSize: typeScale.small,
    letterSpacing: 0.5,
    lineHeight: 20
  },
  featureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    paddingTop: spacing.md
  },
  ctaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: spacing.md
  },
  previewCard: {
    width: 126,
    height: 94,
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.06)"
  },
  previewLabel: {
    position: "absolute",
    left: 8,
    bottom: 8,
    color: palette.textOnDark,
    fontSize: typeScale.tiny,
    fontWeight: fontWeight.medium
  },
  primaryFab: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center"
  },
  primaryFabText: {
    color: palette.textOnDark,
    fontSize: 28,
    lineHeight: 28
  },
  signInLink: {
    marginTop: spacing.sm,
    textAlign: "center",
    color: "rgba(255,255,255,0.72)",
    fontSize: typeScale.small
  },
  signInLinkAccent: {
    color: palette.textOnDark,
    textDecorationLine: "underline"
  }
});
