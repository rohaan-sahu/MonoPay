import { useCallback, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { fetchWalletTransactions, WalletTransactionEntry } from "@mpay/services/wallet-transaction-service";
import { walletService } from "@mpay/services/wallet-service";
import { useAuthStore } from "@mpay/stores/auth-store";
import { transactionsScreen as s } from "@mpay/styles/transactionsScreen";

type FilterType = "all" | "incoming" | "outgoing";

const filters: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "incoming", label: "Incoming" },
  { key: "outgoing", label: "Outgoing" },
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

export default function TransactionsPage() {
  const { currentUser } = useAuthStore();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [transactions, setTransactions] = useState<WalletTransactionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const loadTransactions = useCallback(
    async (refreshing = false) => {
      try {
        setFetchError("");
        setIsRefreshing(refreshing);
        if (!refreshing) {
          setIsLoading(true);
        }

        const walletAddress = currentUser?.walletAddress || (await walletService.getStoredWallet())?.publicKey;

        if (!walletAddress) {
          setTransactions([]);
          setFetchError("Wallet not connected.");
          return;
        }

        const history = await fetchWalletTransactions(walletAddress, {
          limit: 30,
          forceRefresh: refreshing,
          appOnly: true,
        });
        setTransactions(history);
        if (!history.length) {
          setFetchError("No transactions yet.");
        }
      } catch (error) {
        setTransactions([]);
        setFetchError(error instanceof Error ? error.message : "Unable to load transaction history.");
      } finally {
        setIsRefreshing(false);
        setIsLoading(false);
      }
    },
    [currentUser?.walletAddress]
  );

  useFocusEffect(
    useCallback(() => {
      void loadTransactions(false);
    }, [loadTransactions])
  );

  const filtered = useMemo(
    () =>
      transactions.filter((t) => {
        const keyword = search.trim().toLowerCase();
        const matchesSearch =
          !keyword ||
          t.counterpartyLabel.toLowerCase().includes(keyword) ||
          (t.counterpartyTag || "").toLowerCase().includes(keyword) ||
          t.signature.toLowerCase().includes(keyword);
        const matchesFilter =
          activeFilter === "all" ||
          (activeFilter === "incoming" && t.incoming) ||
          (activeFilter === "outgoing" && !t.incoming);
        return matchesSearch && matchesFilter;
      }),
    [activeFilter, search, transactions]
  );

  return (
    <SafeAreaView style={s.page} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.heading}>Transactions</Text>
      </View>

      {/* Search + Filter */}
      <View style={s.searchRow}>
        <View style={s.searchBar}>
          <Feather name="search" size={16} color="#9ca3af" />
          <TextInput
            style={s.searchInput}
            placeholder="Search here"
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <Pressable
          style={[s.filterButton, showFilters && s.filterButtonActive]}
          onPress={() => setShowFilters((v) => !v)}
        >
          <Feather name="sliders" size={18} color="#111111" />
        </Pressable>
      </View>

      {/* Filter chips */}
      {showFilters && (
        <View style={s.filterChipRow}>
          {filters.map((f) => (
            <Pressable
              key={f.key}
              style={[s.filterChip, activeFilter === f.key && s.filterChipActive]}
              onPress={() => setActiveFilter(f.key)}
            >
              <Text style={[s.filterChipText, activeFilter === f.key && s.filterChipTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Divider + label */}
      <View style={s.dividerRow}>
        <Text style={s.dividerLabel}>
          {activeFilter === "all" ? "All transactions" : activeFilter === "incoming" ? "Incoming" : "Outgoing"}
        </Text>
        <View style={s.dividerLine} />
      </View>

      {/* Transaction list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadTransactions(true)} />}
      >
        {isLoading && filtered.length === 0 ? (
          <Text style={s.date}>Loading transactions...</Text>
        ) : filtered.length > 0 ? (
          filtered.map((tx) => (
            <View key={tx.id} style={s.row}>
              <View style={s.rowLeft}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{initialsFromLabel(tx.counterpartyLabel)}</Text>
                </View>
                <View style={s.rowInfo}>
                  <Text style={s.name} numberOfLines={1}>{tx.counterpartyLabel}</Text>
                  <Text style={s.date}>{tx.dateLabel}</Text>
                </View>
              </View>
              <Text style={s.amount}>{tx.amountDisplay}</Text>
            </View>
          ))
        ) : (
          <Text style={s.date}>
            {search || activeFilter !== "all"
              ? "No transactions match this filter."
              : fetchError || "No transactions yet."}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
