import * as SecureStore from "expo-secure-store";
import { PublicKey } from "@solana/web3.js";
import { supabase } from "@mpay/lib/supabase";
import { MetaplexIdCardAdapter } from "@mpay/services/sandbox/id-card-adapter";
import type { CardStatus, SupportedNetwork } from "@mpay/services/sandbox/types";

type Source = "supabase" | "local";
type MetaplexSyncStatus = "synced" | "unknown" | "failed";

export type WalletIdentityRecord = {
  walletAddress: string;
  ownerUserId?: string;
  displayName: string;
  monopayTag: string;
  metaplexCardId: string;
  metaplexCardStatus: CardStatus;
  metaplexNetwork: SupportedNetwork;
  metaplexSyncStatus?: MetaplexSyncStatus;
  metaplexLastSyncAt?: string;
  metaplexLastTxSignature?: string;
  createdAt: string;
  updatedAt: string;
  source: Source;
};

export type EnsureWalletIdentityInput = {
  walletAddress: string;
  ownerUserId?: string;
  displayName?: string;
  phone?: string;
  email?: string;
  preferredTag?: string;
  existingMonopayTag?: string;
  existingMetaplexCardId?: string;
  existingMetaplexCardStatus?: CardStatus;
  existingMetaplexNetwork?: SupportedNetwork;
};

export type UpdateWalletIdentityProfileInput = {
  walletAddress: string;
  ownerUserId?: string;
  displayName?: string;
  phone?: string;
  email?: string;
  desiredMonopayTag?: string;
};

export type OnChainIdentityVerificationResult = {
  walletAddress: string;
  metaplexCardId: string;
  checkedAt: string;
  ok: boolean;
  status: "matched" | "mismatch" | "unavailable";
  mismatches: string[];
  reason?: string;
  expected: {
    owner: string;
    displayName: string;
    paymentPointer: string;
    monopayTag: string;
  };
  onChain?: {
    owner: string;
    displayName: string;
    paymentPointer: string;
    status: CardStatus;
    lastTxSignature?: string;
  };
};

type UnknownError = {
  code?: string;
  message?: string;
};

const LOCAL_PREFIX = "MPAY_WALLET_IDENTITY_";
const DEFAULT_AVATAR_URL = process.env.EXPO_PUBLIC_MONOPAY_PROFILE_AVATAR_FALLBACK_URL || "https://api.dicebear.com/9.x/shapes/svg?seed=monopay";
const DEFAULT_BIO = "Private social payments with MonoPay.";
const GENERIC_TAGS = new Set(["wallet", "user", "monopay", "monopayuser", "account", "newuser"]);

function normalizeWalletAddress(walletAddress: string) {
  return new PublicKey(walletAddress.trim()).toBase58();
}

function stripTagPrefix(tag: string) {
  return tag.trim().replace(/^@+/, "");
}

function ensureTagPrefix(tag: string) {
  const stripped = stripTagPrefix(tag).toLowerCase();
  return `@${stripped}`;
}

function sanitizeTagBase(input: string) {
  const sanitized = stripTagPrefix(input).toLowerCase().replace(/[^a-z0-9_]/g, "");
  return sanitized.slice(0, 18);
}

function walletTagBase(walletAddress: string) {
  return `mono${walletAddress.slice(-6).toLowerCase()}`;
}

function isGenericTag(tag?: string) {
  if (!tag) {
    return true;
  }

  const base = stripTagPrefix(tag).toLowerCase();

  if (!base) {
    return true;
  }

  if (GENERIC_TAGS.has(base)) {
    return true;
  }

  return /^wallet\d*$/.test(base) || /^user\d*$/.test(base) || /^monopayuser\d*$/.test(base);
}

function buildTagSeed(input: EnsureWalletIdentityInput) {
  const preferred = input.preferredTag?.trim();

  if (preferred) {
    const preferredSeed = sanitizeTagBase(preferred);

    if (preferredSeed && !isGenericTag(preferredSeed)) {
      return preferredSeed;
    }
  }

  const display = input.displayName?.trim();

  if (display) {
    const displaySeed = sanitizeTagBase(display.replace(/\s+/g, ""));

    if (displaySeed && !isGenericTag(displaySeed)) {
      return displaySeed;
    }
  }

  return walletTagBase(input.walletAddress);
}

function resolveFallbackTag(input: EnsureWalletIdentityInput) {
  const seed = buildTagSeed(input);
  const walletSeed = walletTagBase(input.walletAddress);
  const base = seed.length >= 3 && !isGenericTag(seed) ? seed : walletSeed;
  return ensureTagPrefix(base);
}

function validateDesiredTag(tag: string) {
  const normalized = sanitizeTagBase(tag);

  if (normalized.length < 3) {
    throw new Error("MonoPay tag must be at least 3 characters.");
  }

  if (isGenericTag(normalized)) {
    throw new Error("Choose a more specific MonoPay tag.");
  }

  return normalized;
}

function normalizeDisplayName(value?: string) {
  const trimmed = value?.trim();

  if (trimmed && trimmed.length >= 2) {
    return trimmed;
  }

  return "MonoPay User";
}

function toSupportedNetwork(value: string | undefined): SupportedNetwork {
  if (value === "solana-mainnet" || value === "solana-testnet" || value === "solana-devnet") {
    return value;
  }

  return "solana-devnet";
}

function isDuplicateConstraintError(error: UnknownError) {
  const message = (error.message || "").toLowerCase();
  return error.code === "23505" || message.includes("duplicate key value") || message.includes("duplicate");
}

function isMissingRelationError(error: UnknownError) {
  const message = (error.message || "").toLowerCase();

  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.code === "42703" ||
    message.includes("relation") && message.includes("does not exist") ||
    message.includes("could not find the table") ||
    message.includes("column") && message.includes("does not exist")
  );
}

function fromSupabaseIdentityRow(row: Record<string, unknown>): WalletIdentityRecord | null {
  const walletAddress = typeof row.wallet_address === "string" ? row.wallet_address.trim() : "";
  const metaplexCardId =
    typeof row.metaplex_card_id === "string"
      ? row.metaplex_card_id.trim()
      : typeof row.card_id === "string"
        ? row.card_id.trim()
        : "";

  if (!walletAddress || !metaplexCardId) {
    return null;
  }

  const maybeTag = typeof row.monopay_tag === "string" ? row.monopay_tag : typeof row.handle === "string" ? row.handle : "";
  const maybeStatus = typeof row.metaplex_card_status === "string" ? row.metaplex_card_status.trim() : "active";

  const status: CardStatus = maybeStatus === "deactivated" ? "deactivated" : "active";

  const fallbackTag = ensureTagPrefix(walletTagBase(walletAddress));
  const normalizedTag = maybeTag && !isGenericTag(maybeTag) ? ensureTagPrefix(maybeTag) : fallbackTag;

  return {
    walletAddress,
    ownerUserId: typeof row.owner_user_id === "string" ? row.owner_user_id : undefined,
    displayName: typeof row.display_name === "string" ? row.display_name : "MonoPay User",
    monopayTag: normalizedTag,
    metaplexCardId,
    metaplexCardStatus: status,
    metaplexNetwork: toSupportedNetwork(typeof row.metaplex_network === "string" ? row.metaplex_network : undefined),
    metaplexSyncStatus: "unknown",
    createdAt: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : new Date().toISOString(),
    source: "supabase",
  };
}

class IdentityProvisioningService {
  private idCardAdapter = new MetaplexIdCardAdapter();
  private secureStoreAvailablePromise = SecureStore.isAvailableAsync().catch(() => false);

  private localKey(walletAddress: string) {
    return `${LOCAL_PREFIX}${walletAddress}`;
  }

  private async saveLocal(identity: WalletIdentityRecord) {
    const secureStoreAvailable = await this.secureStoreAvailablePromise;

    if (!secureStoreAvailable) {
      return;
    }

    try {
      await SecureStore.setItemAsync(this.localKey(identity.walletAddress), JSON.stringify(identity));
    } catch (error) {
      console.warn("[identity-flow] local:write:error", {
        walletAddress: identity.walletAddress,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async getLocal(walletAddress: string): Promise<WalletIdentityRecord | null> {
    const secureStoreAvailable = await this.secureStoreAvailablePromise;

    if (!secureStoreAvailable) {
      return null;
    }

    try {
      const raw = await SecureStore.getItemAsync(this.localKey(walletAddress));

      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as WalletIdentityRecord;

      if (!parsed?.walletAddress || !parsed?.metaplexCardId || !parsed?.monopayTag) {
        return null;
      }

      const normalizedWallet = normalizeWalletAddress(parsed.walletAddress);
      const normalizedTag = ensureTagPrefix(parsed.monopayTag);

      return {
        ...parsed,
        walletAddress: normalizedWallet,
        monopayTag: isGenericTag(normalizedTag) ? ensureTagPrefix(walletTagBase(normalizedWallet)) : normalizedTag,
        metaplexCardStatus: parsed.metaplexCardStatus === "deactivated" ? "deactivated" : "active",
        metaplexNetwork: toSupportedNetwork(parsed.metaplexNetwork),
        metaplexSyncStatus:
          parsed.metaplexSyncStatus === "synced" || parsed.metaplexSyncStatus === "failed" ? parsed.metaplexSyncStatus : "unknown",
        metaplexLastSyncAt: parsed.metaplexLastSyncAt,
        metaplexLastTxSignature: parsed.metaplexLastTxSignature,
        source: "local",
      };
    } catch (error) {
      console.warn("[identity-flow] local:read:error", {
        walletAddress,
        message: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  async clearLocal(walletAddress: string) {
    const secureStoreAvailable = await this.secureStoreAvailablePromise;

    if (!secureStoreAvailable) {
      return;
    }

    try {
      await SecureStore.deleteItemAsync(this.localKey(normalizeWalletAddress(walletAddress)));
    } catch {
      // no-op
    }
  }

  private async getRemote(walletAddress: string) {
    const { data, error } = await supabase
      .from("wallet_identities")
      .select("*")
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    if (error) {
      if (isMissingRelationError(error)) {
        console.warn("[identity-flow] supabase:wallet_identities:missing", {
          walletAddress,
          code: error.code,
          message: error.message,
        });
        return null;
      }

      throw new Error(error.message);
    }

    if (!data || typeof data !== "object") {
      return null;
    }

    return fromSupabaseIdentityRow(data as Record<string, unknown>);
  }

  private async reserveTag(input: EnsureWalletIdentityInput): Promise<string> {
    const fallbackTag = resolveFallbackTag(input);
    const walletAddress = normalizeWalletAddress(input.walletAddress);

    const byWallet = await supabase
      .from("monopay_tags")
      .select("tag")
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    if (byWallet.error) {
      if (isMissingRelationError(byWallet.error)) {
        console.warn("[identity-flow] supabase:monopay_tags:missing", {
          walletAddress,
          code: byWallet.error.code,
          message: byWallet.error.message,
        });
        return fallbackTag;
      }

      throw new Error(byWallet.error.message);
    }

    const baseTag = stripTagPrefix(fallbackTag);
    const suffixes = ["", walletAddress.slice(-4).toLowerCase(), walletAddress.slice(0, 4).toLowerCase(), Date.now().toString(36).slice(-3)];
    const candidates = Array.from(
      new Set(
        suffixes
          .map((suffix) => `${baseTag}${suffix}`.slice(0, 20))
          .filter((candidate) => candidate.length >= 3 && !isGenericTag(candidate))
      )
    );

    if (candidates.length === 0) {
      candidates.push(walletTagBase(walletAddress));
    }

    const existingByWalletTag = byWallet.data?.tag && typeof byWallet.data.tag === "string" ? byWallet.data.tag : null;

    if (existingByWalletTag && !isGenericTag(existingByWalletTag)) {
      return ensureTagPrefix(existingByWalletTag);
    }

    for (const candidate of candidates) {
      if (existingByWalletTag) {
        const update = await supabase
          .from("monopay_tags")
          .update({
            tag: candidate,
            user_id: input.ownerUserId || null,
            status: "active",
          })
          .eq("wallet_address", walletAddress);

        if (!update.error) {
          return ensureTagPrefix(candidate);
        }

        if (isDuplicateConstraintError(update.error)) {
          continue;
        }

        if (isMissingRelationError(update.error)) {
          return fallbackTag;
        }

        throw new Error(update.error.message);
      }

      const { error } = await supabase.from("monopay_tags").insert({
        tag: candidate,
        wallet_address: walletAddress,
        user_id: input.ownerUserId || null,
        status: "active",
      });

      if (!error) {
        return ensureTagPrefix(candidate);
      }

      if (isDuplicateConstraintError(error)) {
        continue;
      }

      if (isMissingRelationError(error)) {
        return fallbackTag;
      }

      throw new Error(error.message);
    }

    return ensureTagPrefix(`${walletTagBase(walletAddress)}${walletAddress.slice(-2).toLowerCase()}`.slice(0, 20));
  }

  private async claimExplicitTag(options: {
    walletAddress: string;
    ownerUserId?: string;
    desiredMonopayTag: string;
  }): Promise<string> {
    const walletAddress = normalizeWalletAddress(options.walletAddress);
    const desiredTag = validateDesiredTag(options.desiredMonopayTag);

    const byWallet = await supabase
      .from("monopay_tags")
      .select("tag")
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    if (byWallet.error) {
      if (isMissingRelationError(byWallet.error)) {
        return ensureTagPrefix(desiredTag);
      }

      throw new Error(byWallet.error.message);
    }

    const currentWalletTag = byWallet.data?.tag && typeof byWallet.data.tag === "string" ? stripTagPrefix(byWallet.data.tag) : undefined;

    if (currentWalletTag === desiredTag) {
      return ensureTagPrefix(desiredTag);
    }

    if (currentWalletTag) {
      const update = await supabase
        .from("monopay_tags")
        .update({
          tag: desiredTag,
          user_id: options.ownerUserId || null,
          status: "active",
        })
        .eq("wallet_address", walletAddress);

      if (!update.error) {
        return ensureTagPrefix(desiredTag);
      }

      if (isDuplicateConstraintError(update.error)) {
        throw new Error("That MonoPay tag is already taken.");
      }

      if (isMissingRelationError(update.error)) {
        return ensureTagPrefix(desiredTag);
      }

      throw new Error(update.error.message);
    }

    const insert = await supabase.from("monopay_tags").insert({
      tag: desiredTag,
      wallet_address: walletAddress,
      user_id: options.ownerUserId || null,
      status: "active",
    });

    if (!insert.error) {
      return ensureTagPrefix(desiredTag);
    }

    if (isDuplicateConstraintError(insert.error)) {
      throw new Error("That MonoPay tag is already taken.");
    }

    if (isMissingRelationError(insert.error)) {
      return ensureTagPrefix(desiredTag);
    }

    throw new Error(insert.error.message);
  }

  private async upsertRemoteIdentity(record: WalletIdentityRecord) {
    const { error } = await supabase.from("wallet_identities").upsert(
      {
        wallet_address: record.walletAddress,
        owner_user_id: record.ownerUserId || null,
        display_name: record.displayName,
        monopay_tag: stripTagPrefix(record.monopayTag),
        metaplex_card_id: record.metaplexCardId,
        metaplex_card_status: record.metaplexCardStatus,
        metaplex_network: record.metaplexNetwork,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
      },
      {
        onConflict: "wallet_address",
      }
    );

    if (!error) {
      return;
    }

    if (isMissingRelationError(error)) {
      return;
    }

    throw new Error(error.message);
  }

  private async upsertProfile(record: WalletIdentityRecord, input: EnsureWalletIdentityInput) {
    if (!record.ownerUserId) {
      return;
    }

    const { error } = await supabase.from("profiles").upsert(
      {
        id: record.ownerUserId,
        full_name: record.displayName,
        phone: input.phone || null,
        email: input.email || null,
        wallet_address: record.walletAddress,
        monopay_tag: stripTagPrefix(record.monopayTag),
        metaplex_card_id: record.metaplexCardId,
        updated_at: record.updatedAt,
      },
      {
        onConflict: "id",
      }
    );

    if (!error) {
      return;
    }

    if (isMissingRelationError(error)) {
      return;
    }

    console.warn("[identity-flow] supabase:profiles:upsert:error", {
      walletAddress: record.walletAddress,
      code: error.code,
      message: error.message,
    });
  }

  async getIdentityForWallet(walletAddress: string): Promise<WalletIdentityRecord | null> {
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    const local = await this.getLocal(normalizedWallet);

    try {
      const remote = await this.getRemote(normalizedWallet);

      if (remote) {
        const mergedRemote: WalletIdentityRecord = {
          ...remote,
          metaplexSyncStatus: local?.metaplexSyncStatus || remote.metaplexSyncStatus || "unknown",
          metaplexLastSyncAt: local?.metaplexLastSyncAt || remote.metaplexLastSyncAt,
          metaplexLastTxSignature: local?.metaplexLastTxSignature || remote.metaplexLastTxSignature,
        };
        await this.saveLocal(mergedRemote);
        return mergedRemote;
      }
    } catch (error) {
      console.warn("[identity-flow] get:remote:error", {
        walletAddress: normalizedWallet,
        message: error instanceof Error ? error.message : String(error),
      });
    }

    return local;
  }

  async verifyIdentityOnChain(walletAddress: string): Promise<OnChainIdentityVerificationResult> {
    const traceId = `id-verify-${Date.now().toString(36)}`;
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    const checkedAt = new Date().toISOString();

    console.log("[identity-flow] verify:onchain:start", {
      traceId,
      walletAddress: normalizedWallet,
    });

    const identity = await this.getIdentityForWallet(normalizedWallet);

    if (!identity) {
      return {
        walletAddress: normalizedWallet,
        metaplexCardId: "",
        checkedAt,
        ok: false,
        status: "unavailable",
        mismatches: [],
        reason: "No wallet identity found.",
        expected: {
          owner: normalizedWallet,
          displayName: "",
          paymentPointer: "",
          monopayTag: "",
        },
      };
    }

    const expectedPaymentPointer = `$monopay.devnet/${stripTagPrefix(identity.monopayTag)}`;
    const expected = {
      owner: identity.walletAddress,
      displayName: identity.displayName,
      paymentPointer: expectedPaymentPointer,
      monopayTag: identity.monopayTag,
    };
    const onChainCard = await this.idCardAdapter.getCard(identity.metaplexCardId).catch((error) => {
      console.warn("[identity-flow] verify:onchain:read:error", {
        traceId,
        walletAddress: normalizedWallet,
        cardId: identity.metaplexCardId,
        message: error instanceof Error ? error.message : String(error),
      });
      return null;
    });

    if (!onChainCard) {
      const unavailableIdentity: WalletIdentityRecord = {
        ...identity,
        metaplexSyncStatus: "failed",
        metaplexLastSyncAt: checkedAt,
        updatedAt: checkedAt,
      };
      await this.saveLocal(unavailableIdentity);

      return {
        walletAddress: normalizedWallet,
        metaplexCardId: identity.metaplexCardId,
        checkedAt,
        ok: false,
        status: "unavailable",
        mismatches: [],
        reason: "Metaplex card is not visible on-chain.",
        expected,
      };
    }

    const mismatches: string[] = [];

    if (onChainCard.owner !== expected.owner) {
      mismatches.push("owner");
    }

    if (onChainCard.plugins.profile.displayName !== expected.displayName) {
      mismatches.push("displayName");
    }

    if (onChainCard.plugins.profile.paymentPointer !== expected.paymentPointer) {
      mismatches.push("paymentPointer");
    }

    const status: OnChainIdentityVerificationResult["status"] = mismatches.length === 0 ? "matched" : "mismatch";
    const ok = status === "matched";
    const mergedIdentity: WalletIdentityRecord = {
      ...identity,
      metaplexSyncStatus: ok ? "synced" : "failed",
      metaplexLastSyncAt: onChainCard.lastSyncAt || checkedAt,
      metaplexLastTxSignature: onChainCard.lastTxSignature || identity.metaplexLastTxSignature,
      updatedAt: checkedAt,
    };
    await this.saveLocal(mergedIdentity);

    console.log("[identity-flow] verify:onchain:done", {
      traceId,
      walletAddress: normalizedWallet,
      cardId: identity.metaplexCardId,
      status,
      mismatches,
      lastTxSignature: mergedIdentity.metaplexLastTxSignature,
    });

    return {
      walletAddress: normalizedWallet,
      metaplexCardId: identity.metaplexCardId,
      checkedAt,
      ok,
      status,
      mismatches,
      expected,
      onChain: {
        owner: onChainCard.owner,
        displayName: onChainCard.plugins.profile.displayName,
        paymentPointer: onChainCard.plugins.profile.paymentPointer,
        status: onChainCard.status,
        lastTxSignature: onChainCard.lastTxSignature,
      },
    };
  }

  async syncIdentityOnChain(walletAddress: string): Promise<WalletIdentityRecord> {
    const traceId = `id-sync-${Date.now().toString(36)}`;
    const normalizedWallet = normalizeWalletAddress(walletAddress);

    console.log("[identity-flow] sync:onchain:start", {
      traceId,
      walletAddress: normalizedWallet,
    });

    const identity = await this.getIdentityForWallet(normalizedWallet);

    if (!identity) {
      throw new Error("No wallet identity found.");
    }

    if (identity.metaplexCardStatus !== "active") {
      throw new Error("Metaplex card is not active.");
    }

    const expectedPaymentPointer = `$monopay.devnet/${stripTagPrefix(identity.monopayTag)}`;
    let onChainCard = await this.idCardAdapter.getCard(identity.metaplexCardId);

    if (!onChainCard) {
      throw new Error("Metaplex card is not visible on-chain.");
    }

    const updatedFields: string[] = [];
    const nowIso = new Date().toISOString();
    const updatedIdentity: WalletIdentityRecord = {
      ...identity,
      updatedAt: nowIso,
    };

    if (onChainCard.plugins.profile.displayName !== identity.displayName) {
      const displayNameUpdate = await this.idCardAdapter.updatePluginField({
        cardId: identity.metaplexCardId,
        plugin: "profile",
        field: "displayName",
        value: identity.displayName,
      });
      onChainCard = displayNameUpdate;
      updatedIdentity.metaplexLastSyncAt = displayNameUpdate.lastSyncAt || nowIso;
      updatedIdentity.metaplexLastTxSignature = displayNameUpdate.lastTxSignature;
      updatedFields.push("displayName");
    }

    if (onChainCard.plugins.profile.paymentPointer !== expectedPaymentPointer) {
      const pointerUpdate = await this.idCardAdapter.updatePluginField({
        cardId: identity.metaplexCardId,
        plugin: "profile",
        field: "paymentPointer",
        value: expectedPaymentPointer,
      });
      onChainCard = pointerUpdate;
      updatedIdentity.metaplexLastSyncAt = pointerUpdate.lastSyncAt || nowIso;
      updatedIdentity.metaplexLastTxSignature = pointerUpdate.lastTxSignature;
      updatedFields.push("paymentPointer");
    }

    if (updatedFields.length === 0) {
      updatedIdentity.metaplexSyncStatus = "synced";
      updatedIdentity.metaplexLastSyncAt = onChainCard.lastSyncAt || nowIso;
      updatedIdentity.metaplexLastTxSignature = onChainCard.lastTxSignature || updatedIdentity.metaplexLastTxSignature;
    }

    await this.saveLocal(updatedIdentity);
    await this.upsertRemoteIdentity(updatedIdentity).catch((error) => {
      console.warn("[identity-flow] sync:onchain:remote:write:error", {
        traceId,
        walletAddress: normalizedWallet,
        message: error instanceof Error ? error.message : String(error),
      });
    });

    const verification = await this.verifyIdentityOnChain(normalizedWallet);

    if (!verification.ok) {
      throw new Error(
        verification.status === "mismatch"
          ? `On-chain sync still mismatched: ${verification.mismatches.join(", ")}`
          : verification.reason || "On-chain sync could not be verified."
      );
    }

    const refreshed = await this.getIdentityForWallet(normalizedWallet);

    console.log("[identity-flow] sync:onchain:done", {
      traceId,
      walletAddress: normalizedWallet,
      cardId: identity.metaplexCardId,
      updatedFields,
      syncStatus: refreshed?.metaplexSyncStatus || "synced",
      lastTxSignature: refreshed?.metaplexLastTxSignature,
    });

    return refreshed || {
      ...updatedIdentity,
      metaplexSyncStatus: "synced",
    };
  }

  async updateIdentityProfile(input: UpdateWalletIdentityProfileInput): Promise<WalletIdentityRecord> {
    const traceId = `id-update-${Date.now().toString(36)}`;
    const walletAddress = normalizeWalletAddress(input.walletAddress);

    console.log("[identity-flow] update:start", {
      traceId,
      walletAddress,
      ownerUserId: input.ownerUserId,
    });

    const existingIdentity =
      (await this.getIdentityForWallet(walletAddress)) ||
      (await this.ensureIdentityForWallet({
        walletAddress,
        ownerUserId: input.ownerUserId,
        displayName: input.displayName,
        phone: input.phone,
        email: input.email,
      }));

    const ownerUserId = input.ownerUserId || existingIdentity.ownerUserId;
    const displayName = normalizeDisplayName(input.displayName || existingIdentity.displayName);
    const nextTagInput = input.desiredMonopayTag ? ensureTagPrefix(input.desiredMonopayTag) : existingIdentity.monopayTag;
    const hasTagChanged = stripTagPrefix(nextTagInput) !== stripTagPrefix(existingIdentity.monopayTag);
    const hasDisplayNameChanged = displayName !== existingIdentity.displayName;
    const monopayTag = hasTagChanged
      ? await this.claimExplicitTag({
          walletAddress,
          ownerUserId,
          desiredMonopayTag: nextTagInput,
        })
      : ensureTagPrefix(nextTagInput);

    const nowIso = new Date().toISOString();
    const updatedIdentity: WalletIdentityRecord = {
      ...existingIdentity,
      walletAddress,
      ownerUserId,
      displayName,
      monopayTag,
      metaplexSyncStatus: existingIdentity.metaplexSyncStatus || "unknown",
      metaplexLastSyncAt: existingIdentity.metaplexLastSyncAt,
      metaplexLastTxSignature: existingIdentity.metaplexLastTxSignature,
      updatedAt: nowIso,
    };

    if (updatedIdentity.metaplexCardStatus === "active" && (hasDisplayNameChanged || hasTagChanged)) {
      const updatedFields: string[] = [];

      try {
        if (hasDisplayNameChanged) {
          const displayNameUpdate = await this.idCardAdapter.updatePluginField({
            cardId: updatedIdentity.metaplexCardId,
            plugin: "profile",
            field: "displayName",
            value: displayName,
          });
          updatedIdentity.metaplexLastSyncAt = displayNameUpdate.lastSyncAt || new Date().toISOString();
          updatedIdentity.metaplexLastTxSignature = displayNameUpdate.lastTxSignature;
          updatedIdentity.metaplexSyncStatus = displayNameUpdate.lastTxSignature ? "synced" : "unknown";
          updatedFields.push("displayName");
        }

        if (hasTagChanged) {
          const pointerUpdate = await this.idCardAdapter.updatePluginField({
            cardId: updatedIdentity.metaplexCardId,
            plugin: "profile",
            field: "paymentPointer",
            value: `$monopay.devnet/${stripTagPrefix(monopayTag)}`,
          });
          updatedIdentity.metaplexLastSyncAt = pointerUpdate.lastSyncAt || new Date().toISOString();
          updatedIdentity.metaplexLastTxSignature = pointerUpdate.lastTxSignature;
          updatedIdentity.metaplexSyncStatus = pointerUpdate.lastTxSignature ? "synced" : "unknown";
          updatedFields.push("paymentPointer");
        }

        console.log("[identity-flow] update:metaplex:onchain-synced", {
          traceId,
          walletAddress,
          cardId: updatedIdentity.metaplexCardId,
          updatedFields,
          signature: updatedIdentity.metaplexLastTxSignature,
          syncedAt: updatedIdentity.metaplexLastSyncAt,
        });
      } catch (error) {
        updatedIdentity.metaplexSyncStatus = "failed";
        console.warn("[identity-flow] update:metaplex:warn", {
          traceId,
          walletAddress,
          cardId: updatedIdentity.metaplexCardId,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    } else if (updatedIdentity.metaplexCardStatus === "active") {
      updatedIdentity.metaplexSyncStatus = updatedIdentity.metaplexSyncStatus || "unknown";
      console.log("[identity-flow] update:metaplex:no-op", {
        traceId,
        walletAddress,
        cardId: updatedIdentity.metaplexCardId,
      });
    }

    await this.saveLocal(updatedIdentity);

    try {
      await this.upsertRemoteIdentity(updatedIdentity);
      await this.upsertProfile(updatedIdentity, {
        walletAddress,
        ownerUserId,
        displayName,
        phone: input.phone,
        email: input.email,
        existingMonopayTag: monopayTag,
      });
      updatedIdentity.source = "supabase";
    } catch (error) {
      console.warn("[identity-flow] update:remote:write:error", {
        traceId,
        walletAddress,
        message: error instanceof Error ? error.message : String(error),
      });
    }

    console.log("[identity-flow] update:done", {
      traceId,
      walletAddress,
      monopayTag: updatedIdentity.monopayTag,
      metaplexSyncStatus: updatedIdentity.metaplexSyncStatus,
      metaplexLastSyncAt: updatedIdentity.metaplexLastSyncAt,
      metaplexLastTxSignature: updatedIdentity.metaplexLastTxSignature,
      source: updatedIdentity.source,
    });

    return updatedIdentity;
  }

  async ensureIdentityForWallet(input: EnsureWalletIdentityInput): Promise<WalletIdentityRecord> {
    const traceId = `id-${Date.now().toString(36)}`;
    const walletAddress = normalizeWalletAddress(input.walletAddress);

    console.log("[identity-flow] ensure:start", {
      traceId,
      walletAddress,
      ownerUserId: input.ownerUserId,
    });

    const existingRemote = await this.getRemote(walletAddress).catch((error) => {
      console.warn("[identity-flow] ensure:remote:read:error", {
        traceId,
        walletAddress,
        message: error instanceof Error ? error.message : String(error),
      });
      return null;
    });
    const existingLocal = existingRemote ? null : await this.getLocal(walletAddress);
    const existing = existingRemote || existingLocal;

    const displayName = normalizeDisplayName(input.displayName || existing?.displayName);
    const existingInputTag = input.existingMonopayTag ? ensureTagPrefix(input.existingMonopayTag) : undefined;
    const existingIdentityTag = existing?.monopayTag ? ensureTagPrefix(existing.monopayTag) : undefined;
    const stableTag = existingIdentityTag && !isGenericTag(existingIdentityTag) ? existingIdentityTag : undefined;
    const stableInputTag = existingInputTag && !isGenericTag(existingInputTag) ? existingInputTag : undefined;
    const monopayTag = stableTag || stableInputTag || (await this.reserveTag({ ...input, walletAddress }));

    if (existingIdentityTag && isGenericTag(existingIdentityTag)) {
      console.log("[identity-flow] ensure:tag:rotated-from-generic", {
        traceId,
        walletAddress,
        previousTag: existingIdentityTag,
        nextTag: monopayTag,
      });
    }
    const nowIso = new Date().toISOString();

    let metaplexCardId = existing?.metaplexCardId || input.existingMetaplexCardId || "";
    let metaplexCardStatus: CardStatus = existing?.metaplexCardStatus || input.existingMetaplexCardStatus || "active";
    let metaplexNetwork: SupportedNetwork = existing?.metaplexNetwork || input.existingMetaplexNetwork || "solana-devnet";
    let metaplexSyncStatus: MetaplexSyncStatus = existing?.metaplexSyncStatus || "unknown";
    let metaplexLastSyncAt = existing?.metaplexLastSyncAt;
    let metaplexLastTxSignature = existing?.metaplexLastTxSignature;
    let createdAt = existing?.createdAt || nowIso;

    if (!metaplexCardId) {
      const createdCard = await this.idCardAdapter.createCard({
        owner: walletAddress,
        displayName,
        avatarUrl: DEFAULT_AVATAR_URL,
        paymentPointer: `$monopay.devnet/${stripTagPrefix(monopayTag)}`,
        bio: DEFAULT_BIO,
      });

      metaplexCardId = createdCard.cardId;
      metaplexCardStatus = createdCard.status;
      metaplexNetwork = createdCard.network;
      metaplexSyncStatus = createdCard.lastTxSignature ? "synced" : "unknown";
      metaplexLastSyncAt = createdCard.lastSyncAt || nowIso;
      metaplexLastTxSignature = createdCard.lastTxSignature;
      createdAt = createdCard.createdAt;

      console.log("[identity-flow] ensure:card:created", {
        traceId,
        walletAddress,
        cardId: metaplexCardId,
      });
    }

    const identity: WalletIdentityRecord = {
      walletAddress,
      ownerUserId: input.ownerUserId || existing?.ownerUserId,
      displayName,
      monopayTag,
      metaplexCardId,
      metaplexCardStatus,
      metaplexNetwork,
      metaplexSyncStatus,
      metaplexLastSyncAt,
      metaplexLastTxSignature,
      createdAt,
      updatedAt: nowIso,
      source: existingRemote ? "supabase" : existing ? "local" : "local",
    };

    await this.saveLocal(identity);

    try {
      await this.upsertRemoteIdentity(identity);
      await this.upsertProfile(identity, input);
      identity.source = "supabase";
    } catch (error) {
      console.warn("[identity-flow] ensure:remote:write:error", {
        traceId,
        walletAddress,
        message: error instanceof Error ? error.message : String(error),
      });
    }

    console.log("[identity-flow] ensure:done", {
      traceId,
      walletAddress,
      monopayTag: identity.monopayTag,
      metaplexCardId: identity.metaplexCardId,
      metaplexSyncStatus: identity.metaplexSyncStatus,
      metaplexLastSyncAt: identity.metaplexLastSyncAt,
      metaplexLastTxSignature: identity.metaplexLastTxSignature,
      source: identity.source,
    });

    return identity;
  }
}

export const identityProvisioningService = new IdentityProvisioningService();
