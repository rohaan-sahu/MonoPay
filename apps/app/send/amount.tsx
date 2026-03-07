import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { fetchWalletBalances, WalletBalanceEntry } from "@mpay/services/wallet-balance-service";
import { walletService } from "@mpay/services/wallet-service";
import { useAuthStore } from "@mpay/stores/auth-store";
import { sendScreen as s } from "@mpay/styles/sendScreen";

const FALLBACK_CURRENCIES: WalletBalanceEntry[] = [
  { symbol: "USDC", label: "USDC • Devnet", amount: 0, display: "$0.00", available: "0", isStable: true },
  { symbol: "SOL", label: "SOL • Devnet", amount: 0, display: "0.00 SOL", available: "0", isStable: false },
];
const SUPPORTED_SEND_ASSETS = new Set(["SOL", "USDC"]);

export default function AmountScreen() {
  const { currentUser } = useAuthStore();
  const params = useLocalSearchParams<{
    recipient?: string;
    recipientName?: string;
    source?: string;
    amount?: string;
  }>();
  const qrRecipient = typeof params.recipient === "string" ? params.recipient.trim() : "";
  const qrRecipientName = typeof params.recipientName === "string" ? params.recipientName.trim() : "";
  const isQrPrefill = params.source === "qr" && qrRecipient.length > 0;
  const [amount, setAmount] = useState(() =>
    params.source === "qr" && typeof params.amount === "string" ? params.amount : ""
  );
  const [memo, setMemo] = useState("");
  const [currencies, setCurrencies] = useState<WalletBalanceEntry[]>(FALLBACK_CURRENCIES);
  const [currencyIndex, setCurrencyIndex] = useState(0);

  const current = currencies[currencyIndex];
  const symbol = current.isStable ? "$" : "◎";
  const tag = currentUser?.monopayTag || currentUser?.handle || "wallet";
  const displayTag = tag.startsWith("@") ? tag.slice(1) : tag;

  const hasAmount = amount.length > 0 && Number.parseFloat(amount) > 0;

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        try {
          const walletAddress =
            currentUser?.walletAddress || (await walletService.getStoredWallet())?.publicKey;
          if (!walletAddress) return;
          const balances = await fetchWalletBalances(walletAddress);
          const supportedBalances = balances.filter((item) => SUPPORTED_SEND_ASSETS.has(item.symbol));
          if (supportedBalances.length) {
            setCurrencies(supportedBalances);
            setCurrencyIndex((prev) => Math.min(prev, supportedBalances.length - 1));
          }
        } catch {
          // keep fallback
        }
      })();
    }, [currentUser?.walletAddress])
  );

  const cycleCurrency = () => {
    setCurrencyIndex((prev) => (prev + 1) % currencies.length);
  };

  const onDigit = (d: string) => {
    if (d === "." && amount.includes(".")) return;
    if (d === "." && amount === "") {
      setAmount("0.");
      return;
    }
    // Limit decimal places
    const parts = amount.split(".");
    if (parts[1] && parts[1].length >= (current.isStable ? 2 : 6)) return;
    setAmount((prev) => prev + d);
  };

  const onDelete = () => {
    setAmount((prev) => prev.slice(0, -1));
  };

  const formatDisplay = (raw: string) => {
    if (!raw) return "0";
    const num = Number.parseFloat(raw);
    if (Number.isNaN(num)) return raw;
    // Format with commas but keep the raw decimal input
    const parts = raw.split(".");
    const intPart = Number.parseInt(parts[0], 10).toLocaleString("en-US");
    return parts[1] !== undefined ? `${intPart}.${parts[1]}` : intPart;
  };

  const handleNext = () => {
    if (isQrPrefill) {
      router.push({
        pathname: "/send/confirm",
        params: {
          amount,
          currency: current.symbol,
          memo,
          isStable: current.isStable ? "1" : "0",
          recipient: qrRecipient,
          recipientName: qrRecipientName,
        },
      });
      return;
    }

    router.push({
      pathname: "/send/recipient",
      params: {
        amount,
        currency: current.symbol,
        memo,
        isStable: current.isStable ? "1" : "0",
      },
    });
  };

  return (
    <SafeAreaView style={s.amountPage} edges={["top"]}>
      {/* Header */}
      <View style={s.amountHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={s.sendFromLabel}>Send From?</Text>
          <Pressable style={s.userPill}>
            <Text style={s.userPillText}>{displayTag}</Text>
            <Feather name="chevron-down" size={14} color="rgba(255,255,255,0.6)" />
          </Pressable>
        </View>
        <Pressable style={s.closeButton} onPress={() => router.back()}>
          <Feather name="x" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Amount Display */}
      <View style={s.amountDisplayArea}>
        <Pressable style={s.currencyTogglePill} onPress={cycleCurrency}>
          <Text style={s.currencyToggleSymbol}>{symbol}</Text>
          <Text style={s.currencyToggleLabel}>{current.symbol}</Text>
          <Feather name="chevron-down" size={14} color="rgba(255,255,255,0.5)" />
        </Pressable>
        <View style={s.amountRow}>
          <Text style={[s.amountText, !amount && s.amountTextEmpty]}>
            {symbol}{formatDisplay(amount) || "0"}
          </Text>
        </View>
        <View style={s.availableRow}>
          <Text style={s.availableText}>
            Available: {current.available} {current.symbol}
          </Text>
        </View>
      </View>

      {/* Numpad */}
      <View style={s.numpad}>
        {[
          ["1", "2", "3"],
          ["4", "5", "6"],
          ["7", "8", "9"],
          [".", "0", "del"],
        ].map((row, ri) => (
          <View key={ri} style={s.numpadRow}>
            {row.map((key) => {
              if (key === "del") {
                return (
                  <Pressable key={key} style={s.numpadKey} onPress={onDelete}>
                    <Feather name="chevron-left" size={28} color="rgba(255,255,255,0.7)" />
                  </Pressable>
                );
              }
              if (key === ".") {
                return (
                  <Pressable key={key} style={s.numpadKey} onPress={() => onDigit(".")}>
                    <Text style={s.numpadDot}>.</Text>
                  </Pressable>
                );
              }
              return (
                <Pressable key={key} style={s.numpadKey} onPress={() => onDigit(key)}>
                  <Text style={s.numpadDigit}>{key}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {/* Bottom: memo + footer */}
      <View style={s.amountBottom}>
        <TextInput
          style={s.memoInput}
          placeholder="What is it for?"
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={memo}
          onChangeText={setMemo}
        />
      </View>

      {/* Dark Footer with CTA */}
      <View style={s.amountFooter}>
        <View style={s.amountFooterInner}>
          <View>
            <Text style={s.footerLabel}>{current.symbol}</Text>
            <Text style={s.footerTitle}>Send</Text>
          </View>
          <Pressable
            style={[s.ctaCircle, !hasAmount && s.ctaCircleDisabled]}
            onPress={handleNext}
            disabled={!hasAmount}
          >
            <Feather name="arrow-right" size={24} color="#111111" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
