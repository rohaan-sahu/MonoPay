import { Redirect,router } from "expo-router";
import { useRef, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import '@/lib/polyfills';


import { DismissKeyboard } from "@/components/DismissKeyboard";
import { useAuthStore } from "@/stores/local-auth-stores";
import { cheksAuthScreen as s } from "@/styles/screenAuth";
import { walletService } from "@/services/walletService";
import { web3AuthService } from "@/services/web3AuthServices";
import { identityProvisioningService } from "@/services/identityProvisioningService";

type WalletOption = "create" | "import";


export default function WalletChoiceScreen() {
  const { currentUser, linkWalletToUser } = useAuthStore();
  const [option, setOption] = useState<WalletOption>("create");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const insets = useSafeAreaInsets();

  if (!currentUser) {
    return <Redirect href="/(auth)/welcome" />;
  }

  const handleContinue = async () => {
    setError("");

    if (option === "import") {
      router.push("/(auth)/walletImport");
      return;
    }

    setIsLoading(true);

    try {
      console.log("[wallet-flow] create:start");
      const wallet = await walletService.createWallet();
      console.log("[wallet-flow] create:ok", { publicKey: wallet.publicKey, mode: wallet.mode });
      const web3Auth = await web3AuthService.signInWithEmbeddedWallet();
      console.log("[wallet-flow] web3-auth:ok", { userId: web3Auth.userId });

      if (web3Auth.walletAddress !== wallet.publicKey) {
        throw new Error("Wallet mismatch after Web3 authentication.");
      }

      const identity = await identityProvisioningService.ensureIdentityForWallet({
        walletAddress: wallet.publicKey,
        ownerUserId: web3Auth.userId,
        displayName: currentUser.fullName,
        phone: currentUser.phone,
        email: currentUser.email,
        preferredTag: currentUser.monopayTag || currentUser.handle,
        existingMonopayTag: currentUser.monopayTag,
        existingMetaplexCardId: currentUser.metaplexCardId,
        existingMetaplexCardStatus: currentUser.metaplexCardStatus,
        existingMetaplexNetwork: currentUser.metaplexNetwork,
      });
      console.log("[wallet-flow] identity:ok", {
        walletAddress: identity.walletAddress,
        monopayTag: identity.monopayTag,
        metaplexCardId: identity.metaplexCardId,
        source: identity.source,
      });

      const result = linkWalletToUser(wallet.publicKey, {
        supabaseUserId: web3Auth.userId,
        monopayTag: identity.monopayTag,
        metaplexCardId: identity.metaplexCardId,
        metaplexCardStatus: identity.metaplexCardStatus,
        metaplexNetwork: identity.metaplexNetwork,
        metaplexSyncStatus: identity.metaplexSyncStatus,
        metaplexLastSyncAt: identity.metaplexLastSyncAt,
        metaplexLastTxSignature: identity.metaplexLastTxSignature,
      });

      if (!result.ok) {
        setError(result.error ?? "Failed to link wallet.");
        return;
      }

      console.log("[wallet-flow] link:ok");
      router.replace("/(auth)/walletBackup");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create wallet. Please try again.";
      console.error("[wallet-flow] create:error", error);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.page} edges={["top"]}>
      <View style={s.root}>
        <View style={[s.orb, s.orbTop]} />
        <View style={[s.orb, s.orbBottom]} />

        <View style={s.content}>
          <View style={s.headerRow}>
            <Pressable style={s.iconButton} onPress={() => router.back()}>
              <Feather name="arrow-left" size={20} color="#525252" />
            </Pressable>
            <View style={{ width: 48 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={s.headingWrap}>
              <Text style={s.heading}>
                Set up your <Text style={s.headingMuted}>wallet</Text>
              </Text>
            </View>

            <Text style={s.helperText}>
              Pick how you want to continue. You can create a new wallet or connect one you already control.
            </Text>

            <Pressable
              style={[s.walletCard, option === "create" && s.walletCardActive]}
              onPress={() => setOption("create")}
            >
              <View style={s.walletRow}>
                <View style={s.walletLeft}>
                  <View style={[s.walletIconWrap, option === "create" && s.walletIconWrapActive]}>
                    <Feather name="plus-circle" size={20} color={option === "create" ? "#fff" : "#171717"} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.walletTitle, option === "create" && s.walletTitleActive]}>Create wallet</Text>
                    <Text style={[s.walletDescription, option === "create" && s.walletDescriptionActive]}>
                      Generate a new MonoPay wallet securely on this device.
                    </Text>
                  </View>
                </View>
                <View style={[s.walletCheck, option === "create" && s.walletCheckActive]}>
                  {option === "create" && <Feather name="check" size={14} color="#171717" />}
                </View>
              </View>
            </Pressable>

            <Pressable
              style={[s.walletCard, option === "import" && s.walletCardActive]}
              onPress={() => setOption("import")}
            >
              <View style={s.walletRow}>
                <View style={s.walletLeft}>
                  <View style={[s.walletIconWrap, option === "import" && s.walletIconWrapActive]}>
                    <Feather name="download" size={20} color={option === "import" ? "#fff" : "#171717"} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.walletTitle, option === "import" && s.walletTitleActive]}>Add your existing wallet</Text>
                    <Text style={[s.walletDescription, option === "import" && s.walletDescriptionActive]}>
                      Connect an existing Solana wallet and keep your current address.
                    </Text>
                  </View>
                </View>
                <View style={[s.walletCheck, option === "import" && s.walletCheckActive]}>
                  {option === "import" && <Feather name="check" size={14} color="#171717" />}
                </View>
              </View>
            </Pressable>

            {!!error && (
              <View style={[s.errorBox, { marginTop: 14 }]}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}
          </ScrollView>
        </View>

        <View style={[s.footerShell, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <View style={s.footer}>
            <View>
              <Text style={s.footerLabel}>next step</Text>
              <Text style={s.footerTitle}>Continue</Text>
            </View>

            <Pressable
              style={[s.ctaButton, isLoading && s.ctaButtonDisabled]}
              onPress={handleContinue}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#171717" />
              ) : (
                <Feather name="arrow-right" size={24} color="#171717" />
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
