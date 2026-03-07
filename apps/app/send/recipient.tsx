import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { fetchPayRecipientPreview, PayRecipientPreview, PayRecipientSuggestion, searchPayRecipients } from "@mpay/services/pay-recipient-service";
import { fetchWalletTransactions } from "@mpay/services/wallet-transaction-service";
import { walletService } from "@mpay/services/wallet-service";
import { useAuthStore } from "@mpay/stores/auth-store";
import { sendScreen as s } from "@mpay/styles/sendScreen";

type FilterMode = "address" | "tag" | "qr";

type RecentRecipientItem = {
  id: string;
  name: string;
  initials: string;
  address: string;
  tag?: string;
  recipientInput: string;
};

function toInitials(label: string) {
  const parts = label
    .trim()
    .replace(/^@/, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "MP";
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function RecipientScreen() {
  const { currentUser } = useAuthStore();
  const params = useLocalSearchParams<{
    amount: string;
    currency: string;
    memo: string;
    isStable: string;
  }>();

  const [filter, setFilter] = useState<FilterMode>("tag");
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<PayRecipientSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [recipientPreview, setRecipientPreview] = useState<PayRecipientPreview | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [recentRecipients, setRecentRecipients] = useState<RecentRecipientItem[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);

  const symbol = params.isStable === "1" ? "$" : "◎";
  const displayAmount = params.amount || "0";

  const switchFilter = (mode: FilterMode) => {
    setFilter(mode);
    setSearch("");
    setSuggestions([]);
    setRecipientPreview(null);
    setPreviewError("");
  };

  useEffect(() => {
    const input = search.trim();
    const normalized = input.replace(/^@+/, "");

    if (filter === "tag" && normalized.length >= 2) {
      let active = true;
      setIsSearching(true);

      const searchTag = `@${normalized}`;
      const timeoutId = setTimeout(() => {
        void (async () => {
          try {
            const found = await searchPayRecipients(searchTag, { limit: 6 });
            if (active) setSuggestions(found);
          } catch {
            if (active) setSuggestions([]);
          } finally {
            if (active) setIsSearching(false);
          }
        })();
      }, 220);

      return () => {
        active = false;
        clearTimeout(timeoutId);
      };
    }

    setSuggestions([]);
    setIsSearching(false);
  }, [search, filter]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadRecentRecipients = async () => {
        setRecentLoading(true);
        try {
          const walletAddress =
            currentUser?.walletAddress || (await walletService.getStoredWallet())?.publicKey;

          if (!walletAddress) {
            if (active) setRecentRecipients([]);
            return;
          }

          const history = await fetchWalletTransactions(walletAddress, {
            limit: 30,
            appOnly: true,
          });
          const uniqueByAddress = new Map<string, RecentRecipientItem>();

          for (const tx of history) {
            if (tx.direction !== "outgoing" || !tx.counterpartyAddress) {
              continue;
            }

            if (uniqueByAddress.has(tx.counterpartyAddress)) {
              continue;
            }

            const tag = tx.counterpartyTag;
            const displayName = tx.counterpartyLabel || shortenAddress(tx.counterpartyAddress);
            uniqueByAddress.set(tx.counterpartyAddress, {
              id: tx.counterpartyAddress,
              name: displayName,
              initials: toInitials(displayName),
              address: shortenAddress(tx.counterpartyAddress),
              tag,
              recipientInput: tag || tx.counterpartyAddress,
            });
          }

          if (active) {
            setRecentRecipients(Array.from(uniqueByAddress.values()).slice(0, 8));
          }
        } catch {
          if (active) setRecentRecipients([]);
        } finally {
          if (active) setRecentLoading(false);
        }
      };

      void loadRecentRecipients();

      return () => {
        active = false;
      };
    }, [currentUser?.walletAddress])
  );

  const selectRecipient = async (recipientInput: string) => {
    setPreviewError("");
    setRecipientPreview(null);
    setPreviewLoading(true);

    try {
      const preview = await fetchPayRecipientPreview(recipientInput);
      setRecipientPreview(preview);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not load recipient.";
      setPreviewError(message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const confirmRecipient = () => {
    if (!recipientPreview) return;
    router.push({
      pathname: "/send/confirm",
      params: {
        amount: params.amount,
        currency: params.currency,
        memo: params.memo,
        isStable: params.isStable,
        recipient: recipientPreview.normalized,
        recipientName: recipientPreview.displayName || "",
      },
    });
  };

  const dismissPreview = () => {
    setRecipientPreview(null);
    setPreviewError("");
  };

  const placeholder =
    filter === "address"
      ? "Paste wallet address"
      : filter === "tag"
        ? "Search @username"
        : "Scan QR to get address";

  return (
    <SafeAreaView style={s.recipientPage} edges={["top"]}>
      {/* Dark header with amount summary */}
      <View style={s.recipientHeader}>
        <View style={s.recipientHeaderRow}>
          <Pressable style={s.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </Pressable>

          <View style={s.amountSummaryPill}>
            <Text style={s.amountSummaryText}>
              {symbol}
              {displayAmount}
            </Text>
            <Text style={s.amountSummaryCurrency}>{params.currency}</Text>
          </View>

          <Pressable style={s.editAmountButton} onPress={() => router.back()}>
            <Feather name="grid" size={18} color="rgba(255,255,255,0.6)" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={s.recipientContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Filter tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.filterScroll}
          contentContainerStyle={s.filterRow}
        >
          <Pressable
            style={[s.filterPill, filter === "address" && s.filterPillActive]}
            onPress={() => switchFilter("address")}
          >
            <Feather
              name="hash"
              size={14}
              color={filter === "address" ? "#fff" : "#4b5563"}
            />
            <Text style={[s.filterPillText, filter === "address" && s.filterPillTextActive]}>
              Wallet Address
            </Text>
          </Pressable>
          <Pressable
            style={[s.filterPill, filter === "tag" && s.filterPillActive]}
            onPress={() => switchFilter("tag")}
          >
            <Feather
              name="at-sign"
              size={14}
              color={filter === "tag" ? "#fff" : "#4b5563"}
            />
            <Text style={[s.filterPillText, filter === "tag" && s.filterPillTextActive]}>
              MonoPay Tag
            </Text>
          </Pressable>
          <Pressable
            style={[s.filterPill, filter === "qr" && s.filterPillActive]}
            onPress={() => switchFilter("qr")}
          >
            <Feather
              name="maximize"
              size={14}
              color={filter === "qr" ? "#fff" : "#4b5563"}
            />
            <Text style={[s.filterPillText, filter === "qr" && s.filterPillTextActive]}>
              Scan QR
            </Text>
          </Pressable>
        </ScrollView>

        {/* Search input / QR handoff */}
        {filter === "qr" ? (
          <Pressable
            style={s.previewCard}
            onPress={() => router.push("/(tabs)/scan")}
          >
            <View style={s.previewTop}>
              <View style={s.previewAvatar}>
                <Feather name="maximize" size={18} color="#9ca3af" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.previewName}>Scan Payment QR</Text>
                <Text style={s.previewWallet}>Open camera and scan recipient code.</Text>
              </View>
              <Feather name="arrow-up-right" size={16} color="#9ca3af" />
            </View>
          </Pressable>
        ) : (
          <View style={s.searchInputWrap}>
            <Feather name="search" size={18} color="#9ca3af" />
            <TextInput
              style={s.searchInput}
              placeholder={placeholder}
              placeholderTextColor="#9ca3af"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={() => {
                const input = search.trim();
                if (input.length === 0) return;

                if (filter === "tag") {
                  const normalized = input.replace(/^@+/, "");
                  if (normalized.length >= 2) {
                    selectRecipient(`@${normalized}`);
                  }
                } else if (filter === "address") {
                  selectRecipient(input);
                }
              }}
              returnKeyType="go"
            />
          </View>
        )}

        {/* Searching state */}
        {isSearching && <Text style={s.searchState}>Searching...</Text>}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <View style={s.suggestionsCard}>
            {suggestions.map((item) => (
              <Pressable
                key={`${item.tag}-${item.walletAddress}`}
                style={s.suggestionRow}
                onPress={() => selectRecipient(item.tag)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.suggestionTag}>{item.tag}</Text>
                  <Text style={s.suggestionMeta}>
                    {item.displayName ? `${item.displayName} • ` : ""}
                    {item.walletAddress.slice(0, 4)}...{item.walletAddress.slice(-4)}
                  </Text>
                </View>
                <Feather name="arrow-up-right" size={16} color="#9ca3af" />
              </Pressable>
            ))}
          </View>
        )}

        {/* Preview loading */}
        {previewLoading && (
          <View style={s.previewCard}>
            <ActivityIndicator size="small" color="#9ca3af" />
            <Text style={s.previewLoadingText}>Loading recipient...</Text>
          </View>
        )}

        {/* Preview error */}
        {!previewLoading && previewError !== "" && (
          <View style={s.previewCard}>
            <Text style={s.previewErrorText}>{previewError}</Text>
            <Pressable onPress={dismissPreview}>
              <Text style={s.previewDismiss}>Dismiss</Text>
            </Pressable>
          </View>
        )}

        {/* Recipient preview card */}
        {!previewLoading && recipientPreview && (
          <View style={s.previewCard}>
            <View style={s.previewTop}>
              <View style={s.previewAvatar}>
                <Text style={s.previewAvatarText}>
                  {recipientPreview.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.previewName}>{recipientPreview.displayName}</Text>
                {recipientPreview.monopayTag && (
                  <Text style={s.previewTag}>{recipientPreview.monopayTag}</Text>
                )}
                <Text style={s.previewWallet}>
                  {recipientPreview.walletAddress.slice(0, 6)}...{recipientPreview.walletAddress.slice(-4)}
                </Text>
              </View>
              <Pressable onPress={dismissPreview} style={s.previewClose}>
                <Feather name="x" size={16} color="#9ca3af" />
              </Pressable>
            </View>
            {recipientPreview.network && (
              <Text style={s.previewMeta}>Network: {recipientPreview.network}</Text>
            )}
            <Pressable style={s.previewConfirmButton} onPress={confirmRecipient}>
              <Text style={s.previewConfirmText}>
                Send {symbol}{displayAmount} to {recipientPreview.displayName.split(" ")[0]}
              </Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </Pressable>
          </View>
        )}

        {/* Quick Transfers */}
        <Text style={s.sectionLabel}>Quick Transfers</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
          <View style={s.recentRow}>
            {!recentLoading && recentRecipients.length === 0 ? (
              <Text style={s.searchState}>No recent recipients yet.</Text>
            ) : (
              recentRecipients.slice(0, 5).map((r) => (
                <Pressable key={r.id} style={s.recentItem} onPress={() => selectRecipient(r.recipientInput)}>
                  <View style={s.recentAvatar}>
                    <Text style={s.recentAvatarText}>{r.initials}</Text>
                  </View>
                  <Text style={s.recentName} numberOfLines={1}>
                    {r.name}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        </ScrollView>

        {/* Recent Transfers */}
        <Text style={s.sectionLabel}>Recent Transfers</Text>
        {recentLoading ? (
          <Text style={s.searchState}>Loading recent transfers...</Text>
        ) : recentRecipients.length === 0 ? (
          <Text style={s.searchState}>No recent transfers yet.</Text>
        ) : (
          recentRecipients.map((item) => (
            <Pressable
              key={item.id}
              style={s.contactRow}
              onPress={() => selectRecipient(item.recipientInput)}
            >
              <View style={s.contactAvatar}>
                <Text style={s.contactAvatarText}>{item.initials}</Text>
              </View>
              <View style={s.contactInfo}>
                <Text style={s.contactName}>{item.name}</Text>
                <Text style={s.contactMeta}>
                  {item.address}
                  {item.tag ? ` • ${item.tag}` : ""}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color="#9ca3af" style={s.contactChevron} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
