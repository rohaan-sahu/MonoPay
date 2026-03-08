import { Redirect, router } from "expo-router";
import { useState } from "react";
import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@mpay/stores/auth-store";
import { cheksAuthScreen as s } from "@mpay/styles/cheksAuthScreen";

function shorten(address: string) {
  if (address.length <= 12) {
    return address;
  }

  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function WalletConflictScreen() {
  const insets = useSafeAreaInsets();
  const { walletConflict, clearDeviceWallet, signOut } = useAuthStore();
  const [isClearing, setIsClearing] = useState(false);

  if (!walletConflict) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const handleRemoveWallet = async () => {
    setIsClearing(true);
    const result = await clearDeviceWallet();
    setIsClearing(false);

    if (!result.ok) {
      Alert.alert("Wallet removal failed", result.error ?? "Could not remove wallet from this device.");
      return;
    }

    router.replace("/(auth)/wallet-import");
  };

  const handleUseAnotherAccount = () => {
    signOut();
    router.replace("/(auth)/sign-in");
  };

  return (
    <SafeAreaView style={s.page} edges={["top"]}>
      <View style={s.root}>
        <View style={[s.orb, s.orbTop]} />
        <View style={[s.orb, s.orbBottom]} />

        <View style={s.content}>
          <View style={s.headerRow}>
            <Pressable style={s.iconButton} onPress={handleUseAnotherAccount}>
              <Feather name="arrow-left" size={20} color="#525252" />
            </Pressable>
            <View style={{ width: 48 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={s.headingWrap}>
              <Text style={s.heading}>
                Wallet <Text style={s.headingMuted}>conflict</Text>
              </Text>
            </View>

            <View style={s.card}>
              <View style={s.cardHeader}>
                <View style={s.cardIconWrap}>
                  <Feather name="alert-triangle" size={20} color="#dc2626" />
                </View>
                <View>
                  <Text style={s.cardTitle}>Device wallet does not match account wallet</Text>
                  <Text style={s.cardSubtitle}>Resolve this before entering the app.</Text>
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <Text style={s.cardSubtitle}>Wallet currently on this device</Text>
                <Text style={s.cardTitle}>{shorten(walletConflict.deviceWalletAddress)}</Text>
                <Text style={[s.cardSubtitle, { marginTop: 10 }]}>Wallet linked to this account</Text>
                <Text style={s.cardTitle}>{shorten(walletConflict.accountWalletAddress)}</Text>
              </View>

              <View style={{ marginTop: 18, gap: 10 }}>
                <Pressable style={s.walletConnectButton} onPress={() => router.replace("/(auth)/wallet-import")}>
                  <Feather name="repeat" size={18} color="#171717" />
                  <Text style={s.walletConnectText}>Switch wallet (import linked one)</Text>
                </Pressable>

                <Pressable
                  style={[s.walletConnectButton, isClearing && { opacity: 0.6 }]}
                  onPress={handleRemoveWallet}
                  disabled={isClearing}
                >
                  {isClearing ? (
                    <ActivityIndicator size="small" color="#171717" />
                  ) : (
                    <Feather name="trash-2" size={18} color="#171717" />
                  )}
                  <Text style={s.walletConnectText}>Remove current wallet from this device</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>

        <View style={[s.footerShell, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <View style={s.footer}>
            <View>
              <Text style={s.footerLabel}>action required</Text>
              <Text style={s.footerTitle}>Resolve</Text>
            </View>
            <Pressable style={s.ctaButton} onPress={() => router.replace("/(auth)/wallet-import")}>
              <Feather name="arrow-right" size={24} color="#171717" />
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
