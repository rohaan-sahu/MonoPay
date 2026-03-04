import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { GradientBackdrop } from "@mpay/components/GradientBackdrop";
import { fetchWalletBalances, WalletBalanceEntry } from "@mpay/services/wallet-balance-service";
import { fetchWalletTransactions, WalletTransactionEntry } from "@mpay/services/wallet-transaction-service";
import { walletService } from "@mpay/services/wallet-service";
import { useAuthStore } from "@mpay/stores/auth-store";
import { homeScreen as s } from "@mpay/styles/homeScreen";

const FALLBACK_CURRENCIES: WalletBalanceEntry[] = [
  { symbol: "USDC", label: "USDC • Devnet", amount: 0, display: "$0.00", available: "0", isStable: true },
  { symbol: "USDT", label: "USDT • Devnet", amount: 0, display: "$0.00", available: "0", isStable: true },
  { symbol: "SOL", label: "SOL • Devnet", amount: 0, display: "0.00 SOL", available: "0", isStable: false },
];

function initialsFromLabel(label: string) {
  const parts = label
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "TX";
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

export default function HomeScreen() {
  const { currentUser } = useAuthStore();
  const [currencies, setCurrencies] = useState<WalletBalanceEntry[]>(FALLBACK_CURRENCIES);
  const [currencyIndex, setCurrencyIndex] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransactionEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [balanceError, setBalanceError] = useState("");
  const [transactionError, setTransactionError] = useState("");
  const current = currencies[currencyIndex];

  const refreshBalances = useCallback(async (forceRefresh = false) => {
    try {
      setIsRefreshing(true);
      setBalanceError("");
      setTransactionError("");

      const walletAddress =
        currentUser?.walletAddress || (await walletService.getStoredWallet())?.publicKey;

      if (!walletAddress) {
        setBalanceError("Wallet not connected.");
        setCurrencies(FALLBACK_CURRENCIES);
        setTransactions([]);
        setTransactionError("No wallet connected.");
        return;
      }

      const [balances, latestTransactions] = await Promise.all([
        fetchWalletBalances(walletAddress, { forceRefresh }),
        fetchWalletTransactions(walletAddress, { limit: 6, forceRefresh, appOnly: true }),
      ]);

      if (!balances.length) {
        setCurrencies(FALLBACK_CURRENCIES);
        setBalanceError("No balances found for this wallet.");
      } else {
        setCurrencies(balances);
        setCurrencyIndex((prev) => Math.min(prev, balances.length - 1));
      }

      setTransactions(latestTransactions);
      if (!latestTransactions.length) {
        setTransactionError("No transactions yet.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to refresh balances.";
      setBalanceError(message);
      setTransactionError("Unable to load transaction history.");
    } finally {
      setIsRefreshing(false);
    }
  }, [currentUser?.walletAddress]);

  useFocusEffect(
    useCallback(() => {
      void refreshBalances(false);
    }, [refreshBalances])
  );

  const cycleCurrency = () => {
    if (!currencies.length) return;
    setCurrencyIndex((prev) => (prev + 1) % currencies.length);
  };

  return (
    <SafeAreaView style={s.page} edges={["top"]}>
      <GradientBackdrop />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refreshBalances(true)} />}
      >
        {/* Header: avatar + search + chat */}
        <View style={s.headerRow}>
          <View style={s.avatar}>
            <Feather name="user" size={18} color="#111111" />
          </View>
          <Pressable style={s.searchBar} onPress={() => router.push("/send/amount")}>
            <Feather name="search" size={16} color="#9ca3af" />
            <Text style={s.searchPlaceholder}>Search</Text>
          </Pressable>
          <Pressable style={s.headerIcon}>
            <Feather name="message-circle" size={20} color="#111111" />
          </Pressable>
        </View>

        {/* Balance + currency toggle */}
        <View>
          <Text style={s.currencyTag}>{current.label}</Text>
          <View style={s.balanceRow}>
            <Text style={s.balanceValue}>{current.display}</Text>
            <Pressable style={s.currencyPill} onPress={cycleCurrency}>
              <Text style={s.currencyPillText}>{current.symbol}</Text>
              <Feather name="chevron-down" size={14} color="#111111" />
            </Pressable>
          </View>
          {!!balanceError && <Text style={s.balanceStatus}>{balanceError}</Text>}
          {isRefreshing && !balanceError ? <Text style={s.balanceStatus}>Refreshing wallet balances...</Text> : null}
        </View>

        {/* Primary action buttons */}
        <View style={s.primaryRow}>
          <Pressable style={s.primaryButton} onPress={() => router.push("/send/amount")}>
            <View style={s.primaryButtonIcon}>
              <Feather name="arrow-up" size={16} color="#111111" />
            </View>
            <Text style={s.primaryButtonLabel}>Send</Text>
          </Pressable>
          <Pressable style={s.primaryButton}>
            <View style={s.primaryButtonIcon}>
              <Feather name="arrow-down" size={16} color="#111111" />
            </View>
            <Text style={s.primaryButtonLabel}>Request</Text>
          </Pressable>
        </View>

        {/* Quick Access */}
        <Text style={s.quickAccessHeader}>Quick Access</Text>
        <View style={s.quickAccessRow}>
          <Pressable style={s.quickAccessItem}>
            <View style={s.quickAccessCircle}>
              <Feather name="camera" size={22} color="#111111" />
            </View>
            <Text style={s.quickAccessLabel}>Scan QR</Text>
          </Pressable>
          <Pressable style={s.quickAccessItem} onPress={() => router.push("/send/amount")}>
            <View style={s.quickAccessCircle}>
              <Feather name="arrow-up-right" size={22} color="#111111" />
            </View>
            <Text style={s.quickAccessLabel}>Send</Text>
          </Pressable>
          <Pressable style={s.quickAccessItem}>
            <View style={s.quickAccessCircle}>
              <Feather name="arrow-down-left" size={22} color="#111111" />
            </View>
            <Text style={s.quickAccessLabel}>Request</Text>
          </Pressable>
          <Pressable style={s.quickAccessItem}>
            <View style={s.quickAccessCircle}>
              <Feather name="maximize" size={22} color="#111111" />
            </View>
            <Text style={s.quickAccessLabel}>QR Pay</Text>
          </Pressable>
        </View>

        {/* Transactions — own background section */}
        <View style={s.txSection}>
          <View style={s.txHeader}>
            <Text style={s.sectionTitle}>Transactions</Text>
            <Pressable onPress={() => router.push("/(tabs)/chat")}>
              <Text style={s.viewAll}>View All</Text>
            </Pressable>
          </View>

          {transactions.length > 0 ? (
            transactions.map((item) => (
              <View key={item.id} style={s.activityRow}>
                <View style={s.activityLeft}>
                  <View style={s.txAvatar}>
                    <Text style={s.txAvatarText}>{initialsFromLabel(item.counterpartyLabel)}</Text>
                  </View>
                  <View>
                    <Text style={s.activityName}>{item.counterpartyLabel}</Text>
                    <Text style={s.activityMeta}>{item.dateLabel}</Text>
                  </View>
                </View>
                <Text style={item.incoming ? s.activityAmountIn : s.activityAmountOut}>
                  {item.amountDisplay}
                </Text>
              </View>
            ))
          ) : (
            <Text style={s.activityMeta}>
              {isRefreshing ? "Refreshing transactions..." : transactionError || "No transactions yet."}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
