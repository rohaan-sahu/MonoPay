import { useCallback, useMemo, useState } from "react";
import { Button, Pressable, StyleSheet, Text, View, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { ensureNotSelfRecipient, parseScannedQrRecipient } from "@mpay/services/qr-payment-service";
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

export default function ScanPayScreen() {
  const { currentUser } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [flashOn, setFlashOn] = useState(false);
  const [scanEnabled, setScanEnabled] = useState(true);
  const [scanError, setScanError] = useState("");
  const scanHint = useMemo(() => {
    if (scanError) return scanError;
    return scanEnabled ? "Align QR code within the frame" : "Processing QR code...";
  }, [scanEnabled, scanError]);

  const handleBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (!scanEnabled) return;

      setScanEnabled(false);
      setScanError("");

      try {
        const parsed = parseScannedQrRecipient(result.data);
        ensureNotSelfRecipient(
          parsed.recipientInput,
          currentUser?.walletAddress,
          currentUser?.monopayTag || currentUser?.handle
        );

        const recipientName =
          parsed.displayName ||
          parsed.monopayTag ||
          (parsed.walletAddress ? `${parsed.walletAddress.slice(0, 6)}...${parsed.walletAddress.slice(-4)}` : "");

        router.push({
          pathname: "/send/amount",
          params: {
            recipient: parsed.recipientInput,
            recipientName,
            source: "qr",
            ...(parsed.requestedAmount ? { amount: parsed.requestedAmount } : {}),
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid QR code.";
        setScanError(message);
        setTimeout(() => {
          setScanEnabled(true);
        }, 1400);
      }
    },
    [scanEnabled, currentUser?.walletAddress, currentUser?.monopayTag, currentUser?.handle]
  );

  if (!permission) {
    return (
      <SafeAreaView style={s.permissionPage} edges={["top"]}>
        <View style={s.permissionCard}>
          <Text style={s.permissionTitle}>Preparing camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={s.permissionPage} edges={["top"]}>
        <View style={s.permissionCard}>
          <Text style={s.permissionTitle}>Camera access needed</Text>
          <Text style={s.permissionSub}>Allow camera permission to scan payment QR codes.</Text>
          <Button title="Grant Permission" onPress={requestPermission} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={s.page}>
      {/* Camera area */}
      <View style={s.cameraArea}>
        <CameraView
          style={s.cameraView}
          facing="back"
          enableTorch={flashOn}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={scanEnabled ? handleBarcodeScanned : undefined}
        />
      </View>

      {/* Overlay content */}
      <SafeAreaView style={s.overlay} edges={["top", "bottom"]} pointerEvents="box-none">
        {/* Top bar */}
        <View style={s.topBar}>
          <Pressable style={s.topBarButton} onPress={() => router.replace("/(tabs)/home")}>
            <Feather name="x" size={22} color={palette.white} />
          </Pressable>
          <Text style={s.topBarTitle}>Scan to Pay</Text>
          <Pressable style={s.topBarButton} onPress={() => setFlashOn((prev) => !prev)}>
            <Feather name={flashOn ? "zap" : "zap-off"} size={20} color={palette.white} />
          </Pressable>
        </View>

        {/* Scanner frame */}
        <View style={s.frameContainer}>
          <Pressable style={s.scanFrame} onPress={() => setScanEnabled(true)}>
            {/* Corner accents */}
            <View style={[s.corner, s.cornerTL]} />
            <View style={[s.corner, s.cornerTR]} />
            <View style={[s.corner, s.cornerBL]} />
            <View style={[s.corner, s.cornerBR]} />
          </Pressable>
          <Text style={[s.scanHint, scanError ? s.scanHintError : null]}>{scanHint}</Text>
        </View>

        {/* Bottom actions */}
        <View style={s.bottomSection}>
          <View style={s.bottomCard}>
            <Pressable style={s.manualButton} onPress={() => router.push("/send/amount")}>
              <View style={s.manualButtonIcon}>
                <Feather name="edit-3" size={18} color={palette.textPrimary} />
              </View>
              <View style={s.manualButtonContent}>
                <Text style={s.manualButtonTitle}>Enter Manually</Text>
                <Text style={s.manualButtonSub}>Type a wallet address or tag</Text>
              </View>
              <Feather name="chevron-right" size={18} color={palette.textMuted} />
            </Pressable>

            <View style={s.divider} />

            <Pressable style={s.manualButton} onPress={() => router.push("/request")}>
              <View style={s.manualButtonIcon}>
                <Feather name="download" size={18} color={palette.textPrimary} />
              </View>
              <View style={s.manualButtonContent}>
                <Text style={s.manualButtonTitle}>My QR Code</Text>
                <Text style={s.manualButtonSub}>Show your code to receive payments</Text>
              </View>
              <Feather name="chevron-right" size={18} color={palette.textMuted} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const CORNER_SIZE = 28;
const FRAME_SIZE = 250;

const s = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#000000",
  },

  permissionPage: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  permissionCard: {
    borderRadius: radius.lg,
    backgroundColor: palette.surfaceLight,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  permissionTitle: {
    color: palette.textPrimary,
    fontSize: typeScale.title,
    fontFamily: displayFont,
    letterSpacing: -0.3,
  },
  permissionSub: {
    color: palette.textMuted,
    fontSize: typeScale.small,
    fontFamily: bodyFont,
    marginBottom: spacing.sm,
  },

  /* Camera */
  cameraArea: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },
  cameraView: {
    flex: 1,
  },

  /* Overlay on top of camera */
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },

  /* Top bar */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  topBarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    color: palette.white,
    fontSize: typeScale.title,
    letterSpacing: -0.4,
    fontWeight: fontWeight.medium as "500",
    fontFamily: displayFont,
  },

  /* Scanner frame */
  frameContainer: {
    alignItems: "center",
    gap: 20,
  },
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: "relative",
  },
  scanHint: {
    color: "rgba(255,255,255,0.6)",
    fontSize: typeScale.small,
    fontFamily: bodyFont,
    textAlign: "center",
  },
  scanHintError: {
    color: "#fca5a5",
  },

  /* Corner accents */
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: palette.white,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },

  /* Bottom section */
  bottomSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  bottomCard: {
    borderRadius: radius.lg,
    backgroundColor: palette.surfaceLight,
    overflow: "hidden",
  },
  manualButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    gap: spacing.sm,
  },
  manualButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  manualButtonContent: {
    flex: 1,
  },
  manualButtonTitle: {
    color: palette.textPrimary,
    fontSize: typeScale.body,
    fontWeight: fontWeight.medium as "500",
    fontFamily: bodyMediumFont,
  },
  manualButtonSub: {
    color: palette.textMuted,
    fontSize: typeScale.tiny,
    fontFamily: bodyFont,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: palette.borderLight,
    marginHorizontal: spacing.lg,
  },
});
