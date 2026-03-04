import { Redirect, router } from "expo-router";
import { useMemo, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DismissKeyboard } from "@mpay/components/DismissKeyboard";
import { GradientBackdrop } from "@mpay/components/GradientBackdrop";
import { useAuthStore } from "@mpay/stores/auth-store";
import { profileEditScreen as s } from "@mpay/styles/profileEditScreen";

function stripTag(tag?: string) {
  return tag?.trim().replace(/^@+/, "") ?? "";
}

export default function ProfileEditPage() {
  const { currentUser, updateProfile } = useAuthStore();
  const [fullName, setFullName] = useState(currentUser?.fullName ?? "");
  const [monopayTag, setMonopayTag] = useState(stripTag(currentUser?.monopayTag || currentUser?.handle));
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const walletAddress = currentUser?.walletAddress;

  const tagPreview = useMemo(() => {
    const sanitized = stripTag(monopayTag).toLowerCase().replace(/[^a-z0-9_]/g, "");

    if (!sanitized) {
      return "@";
    }

    return `@${sanitized}`;
  }, [monopayTag]);

  if (!currentUser) {
    return <Redirect href="/(auth)/welcome" />;
  }

  const handleSave = async () => {
    setError("");
    setIsSaving(true);

    try {
      const result = await updateProfile({
        fullName,
        email,
        monopayTag: tagPreview,
      });

      if (!result.ok) {
        setError(result.error ?? "Could not save profile changes.");
        return;
      }

      router.back();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.page} edges={["top"]}>
      <GradientBackdrop />
      <DismissKeyboard>
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={s.headerRow}>
            <Pressable style={s.iconButton} onPress={() => router.back()}>
              <Feather name="arrow-left" size={20} color="#525252" />
            </Pressable>
            <View style={{ width: 46 }} />
          </View>

          <Text style={s.heading}>Edit profile</Text>
          <Text style={s.helperText}>
            Update your display name, MonoPay tag, and optional email for account recovery and pay-by-username.
          </Text>

          <View style={s.card}>
            <Text style={s.fieldLabel}>Display name</Text>
            <TextInput
              style={s.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your full name"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
            />

            <Text style={s.fieldLabel}>MonoPay tag</Text>
            <View style={s.tagWrap}>
              <Text style={s.tagPrefix}>@</Text>
              <TextInput
                style={s.tagInput}
                value={monopayTag}
                onChangeText={setMonopayTag}
                placeholder="yourname"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />
            </View>
            <Text style={s.hint}>Preview: {tagPreview}</Text>

            <Text style={s.fieldLabel}>Email (optional)</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="done"
            />

            <Text style={s.hint}>Wallet: {walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : "Not linked"}</Text>
            {!!error && <Text style={s.errorText}>{error}</Text>}
          </View>

          <Pressable style={s.buttonPrimary} onPress={handleSave} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={s.buttonPrimaryText}>Save changes</Text>
            )}
          </Pressable>
        </ScrollView>
      </DismissKeyboard>
    </SafeAreaView>
  );
}
