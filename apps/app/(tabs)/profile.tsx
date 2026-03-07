import { Redirect, router } from "expo-router";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, Alert, Clipboard, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { GradientBackdrop } from "@mpay/components/GradientBackdrop";
import { identityProvisioningService, OnChainIdentityVerificationResult, WalletIdentityRecord } from "@mpay/services/identity-provisioning-service";
import { walletService } from "@mpay/services/wallet-service";
import { useAuthStore } from "@mpay/stores/auth-store";
import { profileScreen as s } from "@mpay/styles/profileScreen";

function truncateAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function isGenericTag(tag?: string) {
  const normalized = tag?.trim().replace(/^@+/, "").toLowerCase();
  if (!normalized) return true;
  return normalized === "wallet" || normalized === "user" || /^wallet\d*$/.test(normalized) || /^user\d*$/.test(normalized);
}

function formatNetworkLabel(network?: string) {
  if (!network) return "Solana Devnet";
  if (network === "solana-mainnet") return "Solana Mainnet";
  if (network === "solana-testnet") return "Solana Testnet";
  return "Solana Devnet";
}

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Maps sync status to a tier level (1–3) for the progress bar */
function getTierLevel(syncStatus?: string, cardStatus?: string): number {
  if (syncStatus === "synced" && cardStatus) return 3;
  if (syncStatus === "synced" || cardStatus) return 2;
  return 1;
}

function getTierLabel(tier: number) {
  if (tier === 3) return "Tier 3";
  if (tier === 2) return "Tier 2";
  return "Tier 1";
}

// ─────────────────────────────────────────────
// Setting row component
// ─────────────────────────────────────────────
function SettingRow({
  icon,
  label,
  subtitle,
  onPress,
  isLast,
  danger,
  loading,
  iconColor,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
  isLast?: boolean;
  danger?: boolean;
  loading?: boolean;
  iconColor?: string;
}) {
  return (
    <Pressable
      style={[s.settingRow, !isLast && s.settingRowBorder]}
      onPress={onPress}
      disabled={loading}
    >
      <View style={[s.settingIcon, danger && s.settingIconDanger]}>
        {loading ? (
          <ActivityIndicator size="small" color="#171717" />
        ) : (
          <Feather
            name={icon}
            size={16}
            color={iconColor || (danger ? "#dc2626" : "#4b5563")}
          />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.settingLabel, danger && s.settingLabelDanger]}>{label}</Text>
        {subtitle ? <Text style={s.settingMeta}>{subtitle}</Text> : null}
      </View>
      <Feather name="chevron-right" size={16} color="#d1d5db" style={s.settingChevron} />
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// Main profile page
// ─────────────────────────────────────────────
export default function ProfilePage() {
  const { currentUser, lockApp, signOut } = useAuthStore();
  const currentWalletAddress = currentUser?.walletAddress;
  const currentFullName = currentUser?.fullName;
  const currentEmail = currentUser?.email;
  const currentPhone = currentUser?.phone;
  const currentMonopayTag = currentUser?.monopayTag;

  const [isLoadingWalletState, setIsLoadingWalletState] = useState(true);
  const [walletHasPhrase, setWalletHasPhrase] = useState(false);
  const [isWalletBackedUp, setIsWalletBackedUp] = useState(false);
  const [isRemovingWallet, setIsRemovingWallet] = useState(false);
  const [isVerifyingOnChain, setIsVerifyingOnChain] = useState(false);
  const [isSyncingOnChain, setIsSyncingOnChain] = useState(false);
  const [verificationResult, setVerificationResult] = useState<OnChainIdentityVerificationResult | null>(null);
  const [identityRecord, setIdentityRecord] = useState<WalletIdentityRecord | null>(null);
  const [isDevnet, setIsDevnet] = useState(true);
  const [tagCopied, setTagCopied] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadWalletState = async () => {
        setIsLoadingWalletState(true);
        try {
          const [storedWallet, storedPhrase, backedUp] = await Promise.all([
            walletService.getStoredWallet(),
            walletService.getStoredRecoveryPhrase(),
            walletService.isRecoveryBackedUp(),
          ]);

          if (!isMounted) return;

          const hasWallet = Boolean(storedWallet);
          setWalletHasPhrase(hasWallet && Boolean(storedPhrase));
          setIsWalletBackedUp(hasWallet ? backedUp : true);

          const walletAddress = currentWalletAddress || storedWallet?.publicKey;
          if (walletAddress) {
            const identity = await identityProvisioningService.getIdentityForWallet(walletAddress);
            if (isMounted) setIdentityRecord(identity);
          } else if (isMounted) {
            setIdentityRecord(null);
          }
        } finally {
          if (isMounted) setIsLoadingWalletState(false);
        }
      };

      void loadWalletState();
      return () => { isMounted = false; };
    }, [currentEmail, currentFullName, currentMonopayTag, currentPhone, currentWalletAddress])
  );

  if (!currentUser) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // ── Resolved values ──
  const resolvedTag = [currentUser.monopayTag, identityRecord?.monopayTag, currentUser.handle]
    .find((v) => !isGenericTag(v)) || "@monopay";
  const resolvedNetwork = currentUser.metaplexNetwork || identityRecord?.metaplexNetwork;
  const resolvedCardStatus = currentUser.metaplexCardStatus || identityRecord?.metaplexCardStatus;
  const resolvedSyncStatus = identityRecord?.metaplexSyncStatus || currentUser.metaplexSyncStatus || "unknown";

  const tier = getTierLevel(resolvedSyncStatus, resolvedCardStatus);
  const tierProgress = tier === 3 ? 1 : tier === 2 ? 0.6 : 0.25;

  const verificationLabel =
    verificationResult?.status === "matched"
      ? "Verified on-chain"
      : verificationResult?.status === "mismatch"
        ? `Mismatch: ${verificationResult.mismatches.join(", ")}`
        : verificationResult?.reason || undefined;

  // ── Handlers ──
  const handleVerifyOnChain = async () => {
    const walletAddress = currentWalletAddress || (await walletService.getStoredWallet())?.publicKey;
    if (!walletAddress) return;
    setIsVerifyingOnChain(true);
    try {
      const result = await identityProvisioningService.verifyIdentityOnChain(walletAddress);
      setVerificationResult(result);
      const refreshed = await identityProvisioningService.getIdentityForWallet(walletAddress);
      setIdentityRecord(refreshed);
    } catch (error) {
      setVerificationResult({
        walletAddress: walletAddress,
        metaplexCardId: "",
        checkedAt: new Date().toISOString(),
        ok: false,
        status: "unavailable",
        mismatches: [],
        reason: error instanceof Error ? error.message : "Verification failed.",
        expected: { owner: walletAddress, displayName: "", paymentPointer: "", monopayTag: "" },
      });
    } finally {
      setIsVerifyingOnChain(false);
    }
  };

  const handleSyncOnChain = async () => {
    const walletAddress = currentWalletAddress || (await walletService.getStoredWallet())?.publicKey;
    if (!walletAddress) {
      Alert.alert("Wallet not connected", "Connect a wallet first.");
      return;
    }
    setIsSyncingOnChain(true);
    try {
      const synced = await identityProvisioningService.syncIdentityOnChain(walletAddress);
      setIdentityRecord(synced);
      Alert.alert("Synced", "Metaplex identity is now synced on-chain.");
    } catch (error) {
      Alert.alert("Sync failed", error instanceof Error ? error.message : "Could not sync.");
    } finally {
      setIsSyncingOnChain(false);
    }
  };

  const handleRemoveWallet = () => {
    Alert.alert(
      "Remove wallet from this device?",
      "This signs you out and deletes local wallet keys from this phone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setIsRemovingWallet(true);
              try {
                if (currentWalletAddress) {
                  await identityProvisioningService.clearLocal(currentWalletAddress);
                }
                await walletService.clearWallet();
                signOut();
                router.replace("/(auth)/welcome");
              } catch (error) {
                Alert.alert("Error", error instanceof Error ? error.message : "Failed to remove wallet.");
              } finally {
                setIsRemovingWallet(false);
              }
            })();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={s.page} edges={["top"]}>
      <GradientBackdrop />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        {/* ── HEADER CARD ── */}
        <View style={s.headerCard}>
          <View style={s.headerTopRow}>
            <Pressable style={s.chatIcon} onPress={() => router.push("/(tabs)/chat")}>
              <Feather name="message-square" size={16} color="#fff" />
            </Pressable>
          </View>

          {/* Avatar */}
          <View style={s.avatar}>
            <Text style={s.avatarText}>{getInitials(currentUser.fullName)}</Text>
          </View>

          {/* Name */}
          <Text style={s.headerName}>{currentUser.fullName || "MonoPay User"}</Text>

          {/* Tag + Points */}
          <View style={s.tagRow}>
            <Pressable
              style={s.tagPill}
              onPress={() => {
                Clipboard.setString(resolvedTag);
                setTagCopied(true);
                setTimeout(() => setTagCopied(false), 1500);
              }}
            >
              <Text style={s.tagPillText}>{tagCopied ? "Copied!" : resolvedTag}</Text>
            </Pressable>
            <View style={s.pointsPill}>
              <Text style={s.pointsPillText}>462</Text>
              <Feather name="zap" size={12} color="#f97316" />
            </View>
          </View>

          {/* Tier progress bar */}
          <View style={s.tierCard}>
            <View style={s.tierTopRow}>
              <View style={s.tierBadge}>
                <Feather name="shield" size={12} color="#fff" />
                <Text style={s.tierBadgeText}>{getTierLabel(tier)}</Text>
              </View>
              <Pressable style={s.tierLink} onPress={() => void handleVerifyOnChain()}>
                <Text style={s.tierLinkText}>
                  {isVerifyingOnChain ? "Verifying..." : "Verify Identity"}
                </Text>
                <Feather name="arrow-right" size={12} color="#4b5563" />
              </Pressable>
            </View>

            <View style={s.tierTrack}>
              <View
                style={[
                  s.tierProgress,
                  {
                    width: `${tierProgress * 100}%`,
                    backgroundColor: tier >= 3 ? "#6366f1" : tier >= 2 ? "#a855f7" : "#f97316",
                  },
                ]}
              />
            </View>

            <View style={s.tierLabels}>
              <Text style={[s.tierLabel, tier >= 1 && s.tierLabelActive]}>Tier 1</Text>
              <Text style={[s.tierLabel, tier >= 2 && s.tierLabelActive]}>Tier 2</Text>
              <Text style={[s.tierLabel, tier >= 3 && s.tierLabelActive]}>Tier 3</Text>
            </View>
          </View>

          {/* Quick actions */}
          <View style={s.quickActions}>
            <Pressable
              style={s.quickAction}
              onPress={() => void handleSyncOnChain()}
              disabled={isSyncingOnChain}
            >
              <Feather name="refresh-cw" size={14} color="#111" />
              <Text style={s.quickActionText}>
                {isSyncingOnChain ? "Syncing..." : "Sync"}
              </Text>
            </Pressable>
            <Pressable
              style={s.quickAction}
              onPress={() => {
                lockApp();
                router.replace("/lock");
              }}
            >
              <Feather name="lock" size={14} color="#111" />
              <Text style={s.quickActionText}>Lock</Text>
            </Pressable>
            <Pressable style={s.quickAction} onPress={() => router.push("/sandbox")}>
              <Feather name="code" size={14} color="#111" />
              <Text style={s.quickActionText}>Sandbox</Text>
            </Pressable>
          </View>
        </View>

        {/* Verification status if present */}
        {verificationLabel ? (
          <Text style={verificationResult?.status === "matched" ? s.statusOk : s.statusError}>
            {verificationLabel}
          </Text>
        ) : null}

        {/* ── SEARCH ── */}
        <View style={s.searchWrap}>
          <Feather name="search" size={16} color="#9ca3af" />
          <Text style={s.searchText}>Find a setting</Text>
        </View>

        {/* ── IDENTITY & ACCOUNT ── */}
        <Text style={s.sectionHeader}>Identity & Account</Text>
        <View style={s.sectionCard}>
          <SettingRow
            icon="edit-3"
            label="Edit Profile"
            subtitle={currentUser.email || currentUser.phone || undefined}
            onPress={() => router.push("/profile-edit")}
          />
          <SettingRow
            icon="key"
            label="Change Passcode"
            onPress={() => router.push("/(auth)/setup-passcode")}
            isLast
          />
        </View>

        {/* ── WALLET & SECURITY ── */}
        <Text style={s.sectionHeader}>Wallet & Security</Text>
        <View style={s.sectionCard}>
          <SettingRow
            icon="credit-card"
            label="Wallet Details"
            subtitle={
              currentWalletAddress
                ? `${truncateAddress(currentWalletAddress)} · ${formatNetworkLabel(resolvedNetwork)}`
                : "Not connected"
            }
            onPress={() => {
              if (currentWalletAddress) {
                Clipboard.setString(currentWalletAddress);
                Alert.alert("Copied", "Wallet address copied to clipboard.");
              }
            }}
          />
          <SettingRow
            icon="download"
            label="Export Wallet Key"
            subtitle="Save your secret key for recovery"
            onPress={() => router.push("/(auth)/wallet-export")}
          />
          {!isLoadingWalletState && walletHasPhrase && !isWalletBackedUp && (
            <SettingRow
              icon="shield"
              label="Back Up Recovery Phrase"
              subtitle="Your phrase has not been backed up"
              onPress={() => router.push("/(auth)/wallet-backup")}
            />
          )}

          {/* Network toggle */}
          <View style={[s.settingRow, s.settingRowBorder]}>
            <View style={s.settingIcon}>
              <Feather name="globe" size={16} color="#4b5563" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.settingLabel}>{isDevnet ? "Devnet" : "Mainnet"}</Text>
              <Text style={s.settingMeta}>
                {isDevnet ? "Test network for development" : "Live Solana network"}
              </Text>
            </View>
            <Switch
              value={!isDevnet}
              onValueChange={(val) => setIsDevnet(!val)}
              trackColor={{ false: "#e5e7eb", true: "#111111" }}
              thumbColor="#fff"
            />
          </View>

          <SettingRow
            icon="trash-2"
            label="Remove Wallet"
            onPress={handleRemoveWallet}
            loading={isRemovingWallet}
            danger
            isLast
          />
        </View>

        {/* ── SIGN OUT ── */}
        <View style={s.signOutWrap}>
          <Pressable
            style={s.buttonDanger}
            onPress={() => {
              signOut();
              router.replace("/(auth)/welcome");
            }}
          >
            <Text style={s.buttonDangerText}>Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
