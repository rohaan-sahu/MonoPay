import { useCallback, useMemo, useRef, useState } from "react";
import { Animated, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { GradientBackdrop } from "@mpay/components/GradientBackdrop";
import { BalanceCardGradient } from "@mpay/components/BalanceCardGradient";
import { fetchWalletBalances, WalletBalanceEntry } from "@mpay/services/wallet-balance-service";
import { fetchWalletTransactions, WalletTransactionEntry } from "@mpay/services/wallet-transaction-service";
import { walletService } from "@mpay/services/wallet-service";
import { useAuthStore } from "@mpay/stores/auth-store";
import { homeScreen as s } from "@mpay/styles/homeScreen";
import { palette } from "@mpay/styles/theme";

const FALLBACK_CURRENCIES: WalletBalanceEntry[] = [
  { symbol: "USDC", label: "USDC • Devnet", amount: 0, display: "$0.00", available: "0", isStable: true },
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
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"transactions" | "people">("transactions");
  const blurAnim = useRef(new Animated.Value(0)).current;
  const current = currencies[currencyIndex];

  const toggleBalance = () => {
    const next = !balanceVisible;
    setBalanceVisible(next);
    Animated.timing(blurAnim, {
      toValue: next ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

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
        fetchWalletTransactions(walletAddress, { limit: 4, forceRefresh, appOnly: true }),
      ]);

      if (!balances.length) {
        setCurrencies(FALLBACK_CURRENCIES);
        setBalanceError("No balances found for this wallet.");
      } else {
        setCurrencies(balances);
        setCurrencyIndex((prev) => {
          return Math.min(prev, balances.length - 1);
        });
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

  // Derive unique recent contacts from transactions
  const recentFriends = useMemo(() => {
    const seen = new Set<string>();
    const friends: { label: string; initials: string }[] = [];
    for (const tx of transactions) {
      const key = tx.counterpartyLabel;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      friends.push({ label: key, initials: initialsFromLabel(key) });
      if (friends.length >= 6) break;
    }
    return friends;
  }, [transactions]);

  return (
    <SafeAreaView style={s.page} edges={["top"]}>
      <GradientBackdrop />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refreshBalances(true)} />}
      >
        {/* Header */}
        <View style={s.headerRow}>
          <Pressable style={s.searchBar} onPress={() => router.push("/send/recipient")}>
            <Feather name="search" size={16} color="#9ca3af" />
            <Text style={s.searchPlaceholder}>Find your friends here...</Text>
          </Pressable>
          <Pressable style={s.profileButton} onPress={() => router.push("/(tabs)/profile")}>
            <Text style={s.profileInitials}>
              {currentUser?.fullName
                ? initialsFromLabel(currentUser.fullName)
                : "MP"}
            </Text>
          </Pressable>
        </View>

        {/* Balance + currency toggle */}
        <View style={s.balanceCard}>
          <BalanceCardGradient />
          <View style={s.balanceCardHeader}>
            <Text style={s.balanceLabel}>Balance</Text>
            <Pressable onPress={toggleBalance} style={s.eyeButton}>
              <Feather
                name={balanceVisible ? "eye" : "eye-off"}
                size={18}
                color="rgba(255,255,255,0.6)"
              />
            </Pressable>
          </View>
          <View style={s.balanceRow}>
            <Pressable onPress={toggleBalance} style={s.balanceTouchable}>
              {balanceVisible ? (
                <Text style={s.balanceValue}>{current.display}</Text>
              ) : (
                <Text style={s.balanceValue}>{'*'.repeat(Math.max(current.display.length, 5))}</Text>
              )}
            </Pressable>
            <Pressable style={s.currencyPillDark} onPress={cycleCurrency}>
              <Text style={s.currencyPillDarkText}>{current.symbol}</Text>
              <Feather name="chevron-down" size={14} color="rgba(255,255,255,0.8)" />
            </Pressable>
          </View>
          {!!balanceError && <Text style={s.balanceStatusLight}>{balanceError}</Text>}
          {isRefreshing && !balanceError ? <Text style={s.balanceStatusLight}>Refreshing wallet balances...</Text> : null}

          {/* Action buttons inside card */}
          <View style={s.cardActionRow}>
            <Pressable style={s.cardActionButton} onPress={() => router.push("/send/amount")}>
              <Feather name="arrow-up-right" size={18} color={palette.white} />
              <Text style={s.cardActionLabel}>Send</Text>
            </Pressable>
            <Pressable style={s.cardActionButton} onPress={() => router.push("/request")}>
              <Feather name="arrow-down-left" size={18} color={palette.white} />
              <Text style={s.cardActionLabel}>Request</Text>
            </Pressable>
          </View>
        </View>

        {/* Quick Access */}
        <View style={s.quickAccessRow}>
          <Pressable style={s.quickAccessItem} onPress={() => router.push("/(tabs)/scan")}>
            <View style={s.quickAccessCircle}>
              <Feather name="maximize" size={22} color={palette.textPrimary} />
            </View>
            <Text style={s.quickAccessLabel}>Scan QR</Text>
          </Pressable>
          <Pressable style={s.quickAccessItem} onPress={() => router.push("/send/amount")}>
            <View style={s.quickAccessCircle}>
              <Feather name="send" size={20} color={palette.textPrimary} />
            </View>
            <Text style={s.quickAccessLabel}>Send</Text>
          </Pressable>
          <Pressable style={s.quickAccessItem} onPress={() => router.push("/request")}>
            <View style={s.quickAccessCircle}>
              <Feather name="download" size={22} color={palette.textPrimary} />
            </View>
            <Text style={s.quickAccessLabel}>Request</Text>
          </Pressable>
        </View>

        {/* Friends — recent contacts */}
        {/* {recentFriends.length > 0 && (
          <View style={s.friendsSection}>
            <Text style={s.friendsSectionTitle}>Friends</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.friendsScroll}>
              {recentFriends.map((friend) => (
                <Pressable
                  key={friend.label}
                  style={s.friendItem}
                  onPress={() => router.push("/send/amount")}
                >
                  <View style={s.friendAvatar}>
                    <Text style={s.friendAvatarText}>{friend.initials}</Text>
                  </View>
                  <Text style={s.friendName} numberOfLines={1}>{friend.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )} */}

        {/* Activity section with tab switcher */}
        <View style={s.txSection}>
          {/* Tab bar */}
          <View style={s.tabBar}>
            <Pressable
              style={s.tabItem}
              onPress={() => setActiveTab("transactions")}
            >
              <Text style={activeTab === "transactions" ? s.tabLabelActive : s.tabLabel}>
                Transactions
              </Text>
              <View style={activeTab === "transactions" ? s.tabIndicatorActive : s.tabIndicator} />
            </Pressable>
            <Pressable
              style={s.tabItem}
              onPress={() => setActiveTab("people")}
            >
              <Text style={activeTab === "people" ? s.tabLabelActive : s.tabLabel}>
                People
              </Text>
              <View style={activeTab === "people" ? s.tabIndicatorActive : s.tabIndicator} />
            </Pressable>
          </View>

          {/* Transactions tab */}
          {activeTab === "transactions" && (
            <>
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
            </>
          )}

          {/* People tab */}
          {activeTab === "people" && (
            <>
              {recentFriends.length > 0 ? (
                recentFriends.map((friend) => (
                  <Pressable
                    key={friend.label}
                    style={s.activityRow}
                    onPress={() => router.push("/send/amount")}
                  >
                    <View style={s.activityLeft}>
                      <View style={s.txAvatar}>
                        <Text style={s.txAvatarText}>{friend.initials}</Text>
                      </View>
                      <Text style={s.activityName}>{friend.label}</Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={palette.textMuted} />
                  </Pressable>
                ))
              ) : (
                <Text style={s.activityMeta}>
                  {isRefreshing ? "Loading..." : "No recent contacts yet."}
                </Text>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
