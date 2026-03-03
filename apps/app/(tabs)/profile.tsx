import { Redirect, router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GradientBackdrop } from "@mpay/components/GradientBackdrop";
import { useAuthStore } from "@mpay/stores/auth-store";
import { profileScreen as s } from "@mpay/styles/profileScreen";

function truncateAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function ProfilePage() {
  const { currentUser, lockApp, signOut } = useAuthStore();

  if (!currentUser) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <SafeAreaView style={s.page} edges={["top"]}>
      <GradientBackdrop />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <Text style={s.heading}>Profile</Text>

        <View style={s.card}>
          <Text style={s.label}>METAPLEX IDENTITY CARD</Text>
          <Text style={s.value}>{currentUser.fullName}</Text>

          <View style={s.row}>
            <Text style={s.rowLabel}>Handle</Text>
            <Text style={s.rowValue}>{currentUser.handle}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>{currentUser.phone ? "Phone" : "Email"}</Text>
            <Text style={s.rowValue}>{currentUser.phone || currentUser.email || "-"}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Network</Text>
            <Text style={s.rowValue}>Solana Devnet</Text>
          </View>
          {currentUser.walletAddress && (
            <View style={s.row}>
              <Text style={s.rowLabel}>Wallet</Text>
              <Text style={s.rowValue}>{truncateAddress(currentUser.walletAddress)}</Text>
            </View>
          )}
        </View>

        <Pressable
          style={s.buttonPrimary}
          onPress={() => {
            lockApp();
            router.replace("/lock");
          }}
        >
          <Text style={s.buttonPrimaryText}>Lock app now</Text>
        </Pressable>

        <Pressable style={s.buttonSecondary} onPress={() => router.push("/(auth)/setup-passcode")}>
          <Text style={s.buttonSecondaryText}>Change passcode</Text>
        </Pressable>

        <Pressable style={s.buttonSecondary} onPress={() => router.push("/sandbox")}>
          <Text style={s.buttonSecondaryText}>SDK Sandbox (POC)</Text>
        </Pressable>

        <Pressable
          style={s.buttonDanger}
          onPress={() => {
            signOut();
            router.replace("/(auth)/welcome");
          }}
        >
          <Text style={s.buttonDangerText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
