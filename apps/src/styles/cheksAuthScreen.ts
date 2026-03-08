import { Platform, StyleSheet } from "react-native";

const displayFont = Platform.select({
  ios: "Bricolage Grotesque",
  android: "sans-serif-light",
  default: "sans-serif"
});

const bodyFont = Platform.select({
  ios: "Inter",
  android: "sans-serif",
  default: "sans-serif"
});

export const cheksAuthScreen = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#fdfdfd"
  },
  root: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#fdfdfd"
  },
  orb: {
    position: "absolute",
    borderRadius: 9999,
    backgroundColor: "#f5f5f5"
  },
  orbTop: {
    width: 260,
    height: 260,
    top: -82,
    right: -82,
    opacity: 0.62
  },
  orbBottom: {
    width: 340,
    height: 340,
    bottom: -150,
    left: -140,
    opacity: 0.42
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 0
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1
  },
  headingWrap: {
    marginTop: 20,
    marginBottom: 20
  },
  heading: {
    color: "#171717",
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1.4,
    fontWeight: "300",
    fontFamily: displayFont
  },
  headingMuted: {
    color: "#a3a3a3",
    fontFamily: displayFont
  },
  tabRow: {
    flexDirection: "row",
    gap: 28,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 16,
    marginBottom: 22
  },
  tabActive: {
    color: "#171717",
    fontSize: 29,
    letterSpacing: -0.75,
    fontWeight: "300",
    fontFamily: displayFont
  },
  tabInactive: {
    color: "#d4d4d4",
    fontSize: 29,
    letterSpacing: -0.75,
    fontWeight: "300",
    fontFamily: displayFont
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    padding: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center"
  },
  cardTitle: {
    color: "#171717",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: bodyFont
  },
  cardSubtitle: {
    color: "#a3a3a3",
    fontSize: 11,
    marginTop: 1,
    fontFamily: bodyFont
  },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#fafafa",
    paddingHorizontal: 15,
    color: "#171717",
    fontSize: 16,
    letterSpacing: 0,
    fontFamily: bodyFont
  },
  inputGap: {
    marginBottom: 12
  },
  errorBox: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    fontFamily: bodyFont
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
    gap: 10
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e5e5"
  },
  dividerText: {
    color: "#a3a3a3",
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    fontFamily: bodyFont
  },
  socialRow: {
    flexDirection: "row",
    gap: 10
  },
  socialButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff"
  },
  walletConnectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#171717"
  },
  walletConnectText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: bodyFont
  },
  footerShell: {
    marginTop: 18,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: "#111111",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  footerLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    letterSpacing: 2.3,
    textTransform: "uppercase",
    marginBottom: 4,
    fontFamily: bodyFont
  },
  footerTitle: {
    color: "#fff",
    fontSize: 32,
    letterSpacing: -1,
    fontWeight: "300",
    fontFamily: displayFont
  },
  ctaButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },
  ctaButtonDisabled: {
    opacity: 0.5
  },
  bottomLink: {
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 4,
    fontSize: 14,
    fontFamily: bodyFont
  },
  bottomLinkAccent: {
    color: "rgba(255,255,255,0.82)",
    textDecorationLine: "underline",
    fontFamily: bodyFont
  },
  helperText: {
    color: "#737373",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
    fontFamily: bodyFont
  },
  walletCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    padding: 16,
    backgroundColor: "#fff",
    marginBottom: 12
  },
  walletCardActive: {
    borderColor: "#171717",
    backgroundColor: "#171717"
  },
  walletRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  walletLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1
  },
  walletIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center"
  },
  walletIconWrapActive: {
    backgroundColor: "#2c2c2c"
  },
  walletTitle: {
    color: "#171717",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
    fontFamily: bodyFont
  },
  walletTitleActive: {
    color: "#fff"
  },
  walletDescription: {
    color: "#737373",
    fontSize: 12,
    lineHeight: 17,
    fontFamily: bodyFont
  },
  walletDescriptionActive: {
    color: "rgba(255,255,255,0.75)"
  },
  walletCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#d4d4d4",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },
  walletCheckActive: {
    borderColor: "#fff",
    backgroundColor: "#fff"
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  progressDot: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "#e0e0e0",
    width: 16
  },
  progressDotActive: {
    width: 32,
    backgroundColor: "#171717"
  },
  progressDotDone: {
    width: 16,
    backgroundColor: "#a3a3a3"
  },
  otpRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center"
  },
  otpCell: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#fafafa",
    textAlign: "center" as const,
    fontSize: 22,
    fontWeight: "600" as const,
    color: "#171717",
    fontFamily: bodyFont
  },
  otpCellFocused: {
    borderColor: "#171717",
    borderWidth: 2,
    backgroundColor: "#fff"
  },
  resendText: {
    color: "#a3a3a3",
    fontSize: 14,
    textAlign: "center" as const,
    marginTop: 24,
    fontFamily: bodyFont
  },
  resendAccent: {
    color: "#525252",
    fontWeight: "600" as const,
    fontFamily: bodyFont
  }
});
