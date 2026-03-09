import { Pressable, Share, StyleSheet, Text, View, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";
import { useMemo, useState } from "react";
import { buildMonopayQrPayload } from "@mpay/services/qr-payment-service";
import { useAuthStore } from "@mpay/stores/auth-store";
import { palette, radius, spacing, typeScale, fontWeight } from "@mpay/styles/theme";

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

const bodyMediumFont = Platform.select({
  ios: "Inter-Medium",
  android: "sans-serif-medium",
  default: "sans-serif",
});

function truncateAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

export default function RequestScreen() {
  const { currentUser } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const tag = currentUser?.monopayTag || currentUser?.handle || "@user";
  const displayTag = tag.startsWith("@") ? tag : `@${tag}`;
  const walletAddress = currentUser?.walletAddress || "";
  const displayName = currentUser?.fullName || "MonoPay User";
  const qrPayload = useMemo(() => {
    if (!walletAddress) return "";

    try {
      return buildMonopayQrPayload({
        walletAddress,
        monopayTag: displayTag,
        displayName,
      });
    } catch {
      return "";
    }
  }, [walletAddress, displayTag, displayName]);

  const handleCopy = async () => {
    const payload = walletAddress || qrPayload || displayTag;
    await Clipboard.setStringAsync(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!qrPayload) return;

    try {
      await Share.share({
        title: "MonoPay QR",
        message: `Pay ${displayTag} on MonoPay\n${qrPayload}`,
      });
      setShared(true);
      setTimeout(() => setShared(false), 1800);
    } catch {
      // noop
    }
  };

  return (
    <SafeAreaView style={s.page} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={palette.textPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>Request Payment</Text>
        <View style={s.backButton} />
      </View>

      <View style={s.content}>
        {/* QR Card */}
        <View style={s.qrCard}>
          <View style={s.qrTagRow}>
            <View style={s.tagBadge}>
              <Text style={s.tagBadgeText}>{displayTag}</Text>
            </View>
          </View>

          {/* QR placeholder */}
          <View style={s.qrFrame}>
            <View style={s.qrPlaceholder}>
              {/* Corner accents */}
              <View style={[s.corner, s.cornerTL]} />
              <View style={[s.corner, s.cornerTR]} />
              <View style={[s.corner, s.cornerBL]} />
              <View style={[s.corner, s.cornerBR]} />

              <View style={s.qrInner}>
                {qrPayload ? (
                  <View style={s.qrCodeWrap}>
                    <QRCode value={qrPayload} size={176} />
                  </View>
                ) : (
                  <>
                    <Feather name="maximize" size={48} color={palette.textMuted} />
                    <Text style={s.qrLabel}>No wallet connected</Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* User info */}
          <Text style={s.userName}>{displayName}</Text>
          {walletAddress ? (
            <Text style={s.walletAddress}>{truncateAddress(walletAddress)}</Text>
          ) : null}
        </View>

        {/* Hint text */}
        <Text style={s.hint}>Share your QR code or wallet address to receive payments</Text>

        {/* Action buttons */}
        <View style={s.actions}>
          <Pressable style={s.actionButton} onPress={handleCopy}>
            <Feather name={copied ? "check" : "copy"} size={18} color={palette.white} />
            <Text style={s.actionButtonText}>{copied ? "Copied" : "Copy Address"}</Text>
          </Pressable>
          <Pressable style={s.actionButtonOutline} onPress={handleShare} disabled={!qrPayload}>
            <Feather name="share" size={18} color={palette.textPrimary} />
            <Text style={s.actionButtonOutlineText}>{shared ? "Shared" : "Share"}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: palette.backgroundLight,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: palette.textPrimary,
    fontSize: typeScale.title,
    letterSpacing: -0.4,
    fontWeight: fontWeight.medium as "500",
    fontFamily: displayFont,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    alignItems: "center",
  },

  /* QR Card */
  qrCard: {
    width: "100%",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceLight,
    paddingVertical: 32,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  qrTagRow: {
    marginBottom: 24,
  },
  tagBadge: {
    backgroundColor: palette.surfaceSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  tagBadgeText: {
    color: palette.textPrimary,
    fontSize: typeScale.small,
    fontWeight: fontWeight.semibold as "600",
    fontFamily: bodyMediumFont,
  },
  qrFrame: {
    marginBottom: 24,
  },
  qrPlaceholder: {
    width: 220,
    height: 220,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  qrInner: {
    alignItems: "center",
    gap: 8,
  },
  qrCodeWrap: {
    width: 188,
    height: 188,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  qrLabel: {
    color: palette.textMuted,
    fontSize: typeScale.small,
    fontFamily: bodyFont,
  },

  /* Corner accents */
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: palette.textPrimary,
  },
  cornerTL: {
    top: -1,
    left: -1,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: radius.md,
  },
  cornerTR: {
    top: -1,
    right: -1,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: radius.md,
  },
  cornerBL: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: radius.md,
  },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: radius.md,
  },

  userName: {
    color: palette.textPrimary,
    fontSize: typeScale.body,
    fontWeight: fontWeight.semibold as "600",
    fontFamily: bodyMediumFont,
    marginBottom: 4,
  },
  walletAddress: {
    color: palette.textMuted,
    fontSize: typeScale.small,
    fontFamily: bodyFont,
  },

  /* Hint */
  hint: {
    color: palette.textMuted,
    fontSize: typeScale.small,
    fontFamily: bodyFont,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 28,
    maxWidth: 260,
    lineHeight: 20,
  },

  /* Action buttons */
  actions: {
    width: "100%",
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: palette.panelDark,
  },
  actionButtonText: {
    color: palette.white,
    fontSize: typeScale.body,
    fontWeight: fontWeight.semibold as "600",
    fontFamily: bodyMediumFont,
  },
  actionButtonOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surfaceLight,
  },
  actionButtonOutlineText: {
    color: palette.textPrimary,
    fontSize: typeScale.body,
    fontWeight: fontWeight.semibold as "600",
    fontFamily: bodyMediumFont,
  },
});
