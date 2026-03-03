import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GradientBackdrop } from "@mpay/components/GradientBackdrop";
import { sandboxAdapters, sandboxDefaults } from "@mpay/services/sandbox";
import { ProfilePlugin } from "@mpay/services/sandbox/types";
import { useAuthStore } from "@mpay/stores/auth-store";
import { sandboxScreen as s } from "@mpay/styles/sandboxScreen";

const editablePluginFields: (keyof ProfilePlugin)[] = ["displayName", "paymentPointer", "avatarUrl", "bio"];

function formatIso(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function toExplorerCluster(network: string) {
  if (network === "solana-mainnet") {
    return "mainnet-beta";
  }

  if (network === "solana-testnet") {
    return "testnet";
  }

  return "devnet";
}

export default function SandboxScreen() {
  const { currentUser } = useAuthStore();
  const [logs, setLogs] = useState<string[]>([]);

  const [senderHandle, setSenderHandle] = useState(currentUser?.handle || sandboxDefaults.signerPublicKey || "@monopayuser");
  const [recipientHandle, setRecipientHandle] = useState(sandboxDefaults.defaultRecipientPublicKey || "@merchant");
  const [paymentAmount, setPaymentAmount] = useState("25");
  const [paymentMemo, setPaymentMemo] = useState("Order #104");
  const [paymentResult, setPaymentResult] = useState<string>("");
  const [paymentError, setPaymentError] = useState("");

  const [email, setEmail] = useState("demo@monopay.app");
  const [phone, setPhone] = useState(currentUser?.phone ?? "+15551234567");
  const [fullName, setFullName] = useState(currentUser?.fullName ?? "MonoPay User");
  const [requestId, setRequestId] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneRequired, setPhoneRequired] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [accountResult, setAccountResult] = useState("");
  const [accountError, setAccountError] = useState("");

  const [cardOwner, setCardOwner] = useState(sandboxDefaults.defaultOwnerPublicKey || currentUser?.handle || "@monopayuser");
  const [cardId, setCardId] = useState("");
  const [cardStatus, setCardStatus] = useState("");
  const [cardDisplayName, setCardDisplayName] = useState(currentUser?.fullName ?? "MonoPay User");
  const [cardPointer, setCardPointer] = useState("$monopay.devnet/demo");
  const [cardAvatarUrl, setCardAvatarUrl] = useState("https://images.unsplash.com/photo-1520607162513-77705c0f0d4a");
  const [cardBio, setCardBio] = useState("Private social payments on Solana.");
  const [selectedField, setSelectedField] = useState<keyof ProfilePlugin>("displayName");
  const [fieldValue, setFieldValue] = useState("MonoPay User");
  const [cardResult, setCardResult] = useState("");
  const [cardError, setCardError] = useState("");

  const pushLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 12));
  };

  const handleTriggerPayment = async () => {
    setPaymentError("");
    setPaymentResult("");

    try {
      const result = await sandboxAdapters.payment.createPrivatePayment({
        fromHandle: senderHandle,
        toHandle: recipientHandle,
        amountUsd: Number.parseFloat(paymentAmount),
        memo: paymentMemo,
        assetSymbol: "SOL"
      });

      console.log("[MonoPay Sandbox] Inco payment transaction link:", result.explorerUrl);
      setPaymentResult(`Tx ${result.transactionId}\n${result.explorerUrl}`);
      pushLog(`Payment triggered -> ${result.explorerUrl}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payment failed.";
      setPaymentError(message);
      pushLog(`Payment error -> ${message}`);
    }
  };

  const handleStartAccountLink = async () => {
    setAccountError("");
    setAccountResult("");
    setRequestId("");
    setEmailVerified(false);
    setPhoneVerified(false);
    setPhoneRequired(true);

    try {
      const request = await sandboxAdapters.accountLinking.startRegistration({
        email,
        phone
      });

      setRequestId(request.requestId);
      setPhoneRequired(request.phoneRequired);
      setPhoneVerified(request.phoneVerified);
      pushLog(`Account linking started -> ${request.requestId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not start registration.";
      setAccountError(message);
      pushLog(`Account linking error -> ${message}`);
    }
  };

  const handleVerifyEmail = async () => {
    if (!requestId) {
      setAccountError("Start registration before verification.");
      return;
    }

    setAccountError("");

    try {
      const request = await sandboxAdapters.accountLinking.verifyEmailCode({
        requestId,
        code: emailCode
      });
      setPhoneRequired(request.phoneRequired);
      setEmailVerified(request.emailVerified);
      pushLog("Email verification passed.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Email verification failed.";
      setAccountError(message);
      pushLog(`Email verification error -> ${message}`);
    }
  };

  const handleVerifyPhone = async () => {
    if (!requestId) {
      setAccountError("Start registration before verification.");
      return;
    }

    setAccountError("");

    try {
      const request = await sandboxAdapters.accountLinking.verifyPhoneCode({
        requestId,
        code: phoneCode
      });
      setPhoneRequired(request.phoneRequired);
      setPhoneVerified(request.phoneVerified);
      pushLog("Phone verification passed.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Phone verification failed.";
      setAccountError(message);
      pushLog(`Phone verification error -> ${message}`);
    }
  };

  const handleFinalizeAccount = async () => {
    if (!requestId) {
      setAccountError("Start registration first.");
      return;
    }

    setAccountError("");
    setAccountResult("");

    try {
      const account = await sandboxAdapters.accountLinking.finalizeRegistration({
        requestId,
        fullName
      });

      setAccountResult(`Account ${account.accountId}\n${account.fullName} • ${account.email} • ${account.phone}`);
      pushLog(`Account linked -> ${account.accountId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not finalize account.";
      setAccountError(message);
      pushLog(`Finalize account error -> ${message}`);
    }
  };

  const handleCreateCard = async () => {
    setCardError("");
    setCardResult("");

    try {
      const card = await sandboxAdapters.idCard.createCard({
        owner: cardOwner,
        displayName: cardDisplayName,
        avatarUrl: cardAvatarUrl,
        paymentPointer: cardPointer,
        bio: cardBio
      });
      const assetExplorer = `https://explorer.solana.com/address/${card.cardId}?cluster=${toExplorerCluster(card.network)}`;

      setCardId(card.cardId);
      setCardStatus(card.status);
      setFieldValue(card.plugins.profile.displayName);
      setCardResult(`Card ${card.cardId}\nOwner ${card.owner}\nCreated ${formatIso(card.createdAt)}\n${assetExplorer}`);
      pushLog(`ID card created -> ${card.cardId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create card.";
      setCardError(message);
      pushLog(`ID card create error -> ${message}`);
    }
  };

  const handleUpdateCardField = async () => {
    if (!cardId) {
      setCardError("Create an ID card first.");
      return;
    }

    setCardError("");

    try {
      const card = await sandboxAdapters.idCard.updatePluginField({
        cardId,
        plugin: "profile",
        field: selectedField,
        value: fieldValue
      });
      const assetExplorer = `https://explorer.solana.com/address/${card.cardId}?cluster=${toExplorerCluster(card.network)}`;

      setCardStatus(card.status);
      setCardResult(`Updated ${selectedField} -> ${card.plugins.profile[selectedField]}\n${assetExplorer}`);
      pushLog(`ID card updated -> ${selectedField}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update ID card.";
      setCardError(message);
      pushLog(`ID card update error -> ${message}`);
    }
  };

  const handleImmutableUpdateTest = async () => {
    if (!cardId) {
      setCardError("Create an ID card first.");
      return;
    }

    setCardError("");

    try {
      await sandboxAdapters.idCard.updatePluginField({
        cardId,
        plugin: "profile",
        field: "owner",
        value: "@newowner"
      });

      setCardResult("Unexpected: immutable update succeeded.");
      pushLog("Immutable update test unexpectedly succeeded.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Immutable update was blocked.";
      setCardError(message);
      pushLog(`Immutable update blocked -> ${message}`);
    }
  };

  const handleDeactivateCard = async () => {
    if (!cardId) {
      setCardError("Create an ID card first.");
      return;
    }

    setCardError("");

    try {
      const card = await sandboxAdapters.idCard.deactivateCard({ cardId, reason: "User requested closure" });
      const assetExplorer = `https://explorer.solana.com/address/${card.cardId}?cluster=${toExplorerCluster(card.network)}`;
      setCardStatus(card.status);
      setCardResult(`Card ${card.cardId} is ${card.status} at ${formatIso(card.deactivatedAt ?? "")}\n${assetExplorer}`);
      pushLog(`ID card deactivated -> ${card.cardId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not deactivate card.";
      setCardError(message);
      pushLog(`ID card deactivate error -> ${message}`);
    }
  };

  return (
    <SafeAreaView style={s.page} edges={["top"]}>
      <GradientBackdrop />

      <ScrollView
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={s.content}
      >
          <View style={s.headerRow}>
            <Pressable style={s.backButton} onPress={() => router.back()}>
              <Text style={s.backButtonText}>‹</Text>
            </Pressable>
            <View style={s.headingWrap}>
              <Text style={s.heading}>SDK Sandbox</Text>
              <Text style={s.subtitle}>POC before wiring into production MonoPay flow</Text>
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>1) Private payment trigger</Text>
            <Text style={s.cardMeta}>
              Uses Solana transaction + mandatory Inco remote encryption endpoint and logs explorer URL.
            </Text>

            <View>
              <Text style={s.label}>Sender handle</Text>
              <TextInput style={s.input} autoCapitalize="none" value={senderHandle} onChangeText={setSenderHandle} />
            </View>

            <View style={s.row}>
              <View style={s.rowItem}>
                <Text style={s.label}>Recipient handle or wallet</Text>
                <TextInput style={s.input} autoCapitalize="none" value={recipientHandle} onChangeText={setRecipientHandle} />
              </View>
              <View style={s.rowItem}>
                <Text style={s.label}>Amount (USD input)</Text>
                <TextInput
                  style={s.input}
                  keyboardType="decimal-pad"
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                />
              </View>
            </View>

            <View>
              <Text style={s.label}>Memo</Text>
              <TextInput style={s.input} value={paymentMemo} onChangeText={setPaymentMemo} />
            </View>

            <Pressable style={s.buttonDark} onPress={handleTriggerPayment}>
              <Text style={s.buttonDarkText}>Trigger Inco Payment</Text>
            </Pressable>

            {!!paymentResult && (
              <View style={s.resultBox}>
                <Text style={s.resultText}>{paymentResult}</Text>
              </View>
            )}
            {!!paymentError && <Text style={s.errorText}>{paymentError}</Text>}
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>2) Email + phone account linking</Text>
            <Text style={s.cardMeta}>
              Start registration, verify email, then finalize. Phone verification is optional in email-only mode.
            </Text>
            <Text style={s.cardMeta}>
              Use OTP emails from Supabase. If you receive magic links only, switch template to {"{{ .Token }}"}.
            </Text>

            <View>
              <Text style={s.label}>Full name</Text>
              <TextInput style={s.input} value={fullName} onChangeText={setFullName} />
            </View>

            <View style={s.row}>
              <View style={s.rowItem}>
                <Text style={s.label}>Email</Text>
                <TextInput
                  style={s.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
              <View style={s.rowItem}>
                <Text style={s.label}>Phone</Text>
                <TextInput
                  style={s.input}
                  autoCapitalize="none"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            <Pressable style={s.buttonDark} onPress={handleStartAccountLink}>
              <Text style={s.buttonDarkText}>Start registration</Text>
            </Pressable>

            {!!requestId && (
              <View style={s.resultBox}>
                <Text style={s.resultText}>Request ID: {requestId}</Text>
              </View>
            )}

            <View style={s.row}>
              <View style={s.rowItem}>
                <Text style={s.label}>Email code</Text>
                <TextInput style={s.input} value={emailCode} onChangeText={setEmailCode} keyboardType="number-pad" />
                <Pressable style={s.buttonLight} onPress={handleVerifyEmail}>
                  <Text style={s.buttonLightText}>Verify email</Text>
                </Pressable>
              </View>
              {phoneRequired ? (
                <View style={s.rowItem}>
                  <Text style={s.label}>Phone code</Text>
                  <TextInput style={s.input} value={phoneCode} onChangeText={setPhoneCode} keyboardType="number-pad" />
                  <Pressable style={s.buttonLight} onPress={handleVerifyPhone}>
                    <Text style={s.buttonLightText}>Verify phone</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={s.rowItem}>
                  <Text style={s.label}>Phone verification</Text>
                  <View style={s.resultBox}>
                    <Text style={s.resultText}>Disabled (email-only mode)</Text>
                  </View>
                </View>
              )}
            </View>

            <View style={s.badgeRow}>
              <View style={[s.badge, emailVerified && s.badgeActive]}>
                <Text style={[s.badgeText, emailVerified && s.badgeTextActive]}>
                  Email {emailVerified ? "verified" : "pending"}
                </Text>
              </View>
              <View style={[s.badge, phoneVerified && s.badgeActive]}>
                <Text style={[s.badgeText, phoneVerified && s.badgeTextActive]}>
                  Phone {!phoneRequired ? "not required" : phoneVerified ? "verified" : "pending"}
                </Text>
              </View>
            </View>

            <Pressable
              style={[s.buttonDark, (!emailVerified || (phoneRequired && !phoneVerified)) && s.buttonDarkDisabled]}
              onPress={handleFinalizeAccount}
            >
              <Text style={s.buttonDarkText}>Finalize account creation</Text>
            </Pressable>

            {!!accountResult && (
              <View style={s.resultBox}>
                <Text style={s.resultText}>{accountResult}</Text>
              </View>
            )}
            {!!accountError && <Text style={s.errorText}>{accountError}</Text>}
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>3) ID card lifecycle (Metaplex-style)</Text>
            <Text style={s.cardMeta}>Create card, edit plugin fields, test immutable protection, deactivate card.</Text>

            <View>
              <Text style={s.label}>Owner wallet or mapped handle</Text>
              <TextInput style={s.input} autoCapitalize="none" value={cardOwner} onChangeText={setCardOwner} />
            </View>

            <View style={s.row}>
              <View style={s.rowItem}>
                <Text style={s.label}>Display name</Text>
                <TextInput style={s.input} value={cardDisplayName} onChangeText={setCardDisplayName} />
              </View>
              <View style={s.rowItem}>
                <Text style={s.label}>Payment pointer</Text>
                <TextInput
                  style={s.input}
                  autoCapitalize="none"
                  value={cardPointer}
                  onChangeText={setCardPointer}
                />
              </View>
            </View>

            <View>
              <Text style={s.label}>Avatar URL</Text>
              <TextInput style={s.input} autoCapitalize="none" value={cardAvatarUrl} onChangeText={setCardAvatarUrl} />
            </View>

            <View>
              <Text style={s.label}>Bio</Text>
              <TextInput style={s.textArea} value={cardBio} onChangeText={setCardBio} multiline />
            </View>

            <Pressable style={s.buttonDark} onPress={handleCreateCard}>
              <Text style={s.buttonDarkText}>Create ID card</Text>
            </Pressable>

            {!!cardId && (
              <View style={s.resultBox}>
                <Text style={s.resultText}>
                  Card ID: {cardId}
                  {"\n"}
                  Status: {cardStatus}
                </Text>
              </View>
            )}

            <Text style={s.label}>Editable plugin field</Text>
            <View style={s.badgeRow}>
              {editablePluginFields.map((field) => (
                <Pressable
                  key={field}
                  style={[s.badge, selectedField === field && s.badgeActive]}
                  onPress={() => setSelectedField(field)}
                >
                  <Text style={[s.badgeText, selectedField === field && s.badgeTextActive]}>{field}</Text>
                </Pressable>
              ))}
            </View>

            <TextInput style={s.input} value={fieldValue} onChangeText={setFieldValue} />

            <Pressable style={s.buttonLight} onPress={handleUpdateCardField}>
              <Text style={s.buttonLightText}>Update plugin value</Text>
            </Pressable>

            <Pressable style={s.buttonLight} onPress={handleImmutableUpdateTest}>
              <Text style={s.buttonLightText}>Test immutable field protection</Text>
            </Pressable>

            <Pressable style={s.buttonDark} onPress={handleDeactivateCard}>
              <Text style={s.buttonDarkText}>Deactivate / close card</Text>
            </Pressable>

            {!!cardResult && (
              <View style={s.resultBox}>
                <Text style={s.resultText}>{cardResult}</Text>
              </View>
            )}
            {!!cardError && <Text style={s.errorText}>{cardError}</Text>}
          </View>

        <View style={s.logPanel}>
          <Text style={s.logTitle}>POC logs</Text>
          {logs.length === 0 ? <Text style={s.logItem}>No actions yet.</Text> : null}
          {logs.map((item) => (
            <Text style={s.logItem} key={item}>
              {item}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
