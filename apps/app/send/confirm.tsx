import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { privatePaymentService } from "@mpay/services/private-payment-service";
import { useAuthStore } from "@mpay/stores/auth-store";
import { sendScreen as s } from "@mpay/styles/sendScreen";

export default function ConfirmScreen() {
  const { currentUser } = useAuthStore();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    amount: string;
    currency: string;
    memo: string;
    isStable: string;
    recipient: string;
    recipientName: string;
    authorized: string;
  }>();

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    recipient: string;
    explorerUrl: string;
    transactionId: string;
  } | null>(null);
  const didAutoFire = useRef(false);

  const symbol = params.isStable === "1" ? "$" : "◎";
  const amountValue = Number.parseFloat(params.amount || "0");
  const recipientDisplay = params.recipientName || params.recipient || "Unknown";
  const recipientShort = params.recipient?.startsWith("@")
    ? params.recipient
    : params.recipient
      ? `${params.recipient.slice(0, 6)}...${params.recipient.slice(-4)}`
      : "";

  // Auto-fire payment when returning from authorize screen
  useEffect(() => {
    if (params.authorized === "1" && !didAutoFire.current && !success && !isSending) {
      didAutoFire.current = true;
      void handleConfirm();
    }
  }, [params.authorized]);

  const navigateToAuthorize = () => {
    router.push({
      pathname: "/send/authorize",
      params: {
        amount: params.amount,
        currency: params.currency,
        memo: params.memo,
        isStable: params.isStable,
        recipient: params.recipient,
        recipientName: params.recipientName,
      },
    });
  };

  const handleConfirm = async () => {
    setError("");

    const fromHandleBase = (currentUser?.monopayTag || currentUser?.handle || "").trim();
    if (!fromHandleBase) {
      setError("Your account is missing a sender tag.");
      return;
    }

    const fromHandle = fromHandleBase.startsWith("@") ? fromHandleBase : `@${fromHandleBase}`;

    try {
      setIsSending(true);
      const result = await privatePaymentService.sendByRecipient({
        fromHandle,
        senderUserId: currentUser?.supabaseUserId,
        senderWalletAddress: currentUser?.walletAddress,
        recipientInput: params.recipient,
        amount: amountValue,
        memo: params.memo || `${params.currency} payment`,
        assetSymbol: params.currency,
      });

      setSuccess({
        recipient: result.recipient.normalized,
        explorerUrl: result.payment.explorerUrl,
        transactionId: result.payment.transactionId,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment failed.";
      setError(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleDone = () => {
    router.dismissAll();
    router.replace("/(tabs)/home");
  };

  if (success) {
    return (
      <SafeAreaView style={s.confirmPage} edges={["top"]}>
        <View style={s.confirmContent}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <View style={s.statusSuccess}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: "#111111",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                }}
              >
                <Feather name="check" size={28} color="#fff" />
              </View>
              <Text style={s.statusSuccessTitle}>Payment Sent!</Text>
              <Text style={s.statusSuccessMeta}>
                {symbol}{params.amount} {params.currency} sent to {success.recipient}
              </Text>
              <Text style={s.statusSuccessMeta}>
                Tx: {success.transactionId.slice(0, 10)}...{success.transactionId.slice(-8)}
              </Text>
              <Pressable
                style={s.statusLinkButton}
                onPress={() => void Linking.openURL(success.explorerUrl)}
              >
                <Text style={s.statusLinkText}>View on Explorer</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={[s.confirmFooter, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={s.confirmFooterInner}>
            <View>
              <Text style={s.footerLabel}>complete</Text>
              <Text style={s.footerTitle}>Done</Text>
            </View>
            <Pressable style={s.ctaCircle} onPress={handleDone}>
              <Feather name="check" size={24} color="#111111" />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.confirmPage} edges={["top"]}>
      <ScrollView
        style={s.confirmContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View style={s.confirmHeaderRow}>
          <Pressable style={s.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color="#111111" />
          </Pressable>
          <Text style={s.confirmTitle}>Confirm Payment</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Summary Card */}
        <View style={s.summaryCard}>
          {/* Amount */}
          <View>
            <Text style={s.summaryLabel}>Amount</Text>
            <Text style={s.summaryAmountValue}>
              {symbol}{Number.parseFloat(params.amount || "0").toLocaleString("en-US")}
            </Text>
            <Text style={[s.summaryLabel, { marginTop: 4, textTransform: "none", letterSpacing: 0 }]}>
              {params.currency}
            </Text>
          </View>

          <View style={s.summaryDivider} />

          {/* Recipient */}
          <View>
            <Text style={s.summaryLabel}>Recipient</Text>
            <View style={[s.recipientCard, { marginTop: 8 }]}>
              <View style={s.recipientAvatar}>
                <Text style={s.recipientAvatarText}>
                  {recipientDisplay
                    .split(" ")
                    .map((n: string) => n.charAt(0))
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </Text>
              </View>
              <View>
                <Text style={s.recipientName}>{recipientDisplay}</Text>
                <Text style={s.recipientAddress}>{recipientShort}</Text>
              </View>
            </View>
          </View>

          {params.memo ? (
            <>
              <View style={s.summaryDivider} />
              <View>
                <Text style={s.summaryLabel}>Memo</Text>
                <View style={[s.memoRow, { marginTop: 6 }]}>
                  <Feather name="file-text" size={14} color="#4b5563" />
                  <Text style={s.memoText}>{params.memo}</Text>
                </View>
              </View>
            </>
          ) : null}

          <View style={s.summaryDivider} />

          {/* Network */}
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Network</Text>
            <Text style={s.summaryValue}>Solana Devnet</Text>
          </View>
        </View>

        {!!error && (
          <View style={s.statusError}>
            <Text style={s.statusErrorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Dark Footer */}
      <View style={[s.confirmFooter, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={s.confirmFooterInner}>
          <View>
            <Text style={s.footerLabel}>total</Text>
            <Text style={s.footerTitle}>
              {symbol}{Number.parseFloat(params.amount || "0").toLocaleString("en-US")}
            </Text>
          </View>
          <Pressable
            style={[s.ctaCircle, isSending && s.ctaCircleDisabled]}
            onPress={navigateToAuthorize}
            disabled={isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#111111" />
            ) : (
              <Feather name="lock" size={22} color="#111111" />
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
