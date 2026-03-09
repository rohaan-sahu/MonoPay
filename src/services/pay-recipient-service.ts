import { PublicKey } from "@solana/web3.js";
import { supabase } from "@mpay/lib/supabase";

export type ResolvedPayRecipient = {
  input: string;
  normalized: string;
  walletAddress: string;
  source: "tag" | "wallet";
};

export type PayRecipientSuggestion = {
  tag: string;
  walletAddress: string;
  displayName?: string;
};

export type PayRecipientPreview = {
  input: string;
  normalized: string;
  walletAddress: string;
  source: "tag" | "wallet";
  displayName: string;
  monopayTag?: string;
  contact?: string;
  network?: string;
  metaplexCardId?: string;
};

type UnknownError = {
  code?: string;
  message?: string;
};

function stripTagPrefix(tag: string) {
  return tag.trim().replace(/^@+/, "").toLowerCase();
}

function isMissingRelationError(error: UnknownError) {
  const message = (error.message || "").toLowerCase();

  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    message.includes("relation") && message.includes("does not exist") ||
    message.includes("could not find the table")
  );
}

function assertWalletAddress(address: string, label: string) {
  try {
    return new PublicKey(address.trim()).toBase58();
  } catch {
    throw new Error(`Invalid ${label}.`);
  }
}

type ProfileLookupRow = {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  wallet_address?: string | null;
  monopay_tag?: string | null;
};

type IdentityLookupRow = {
  display_name?: string | null;
  wallet_address?: string | null;
  monopay_tag?: string | null;
  metaplex_card_id?: string | null;
  metaplex_network?: string | null;
};

type TagLookupRow = {
  tag: string;
  wallet_address: string;
  status: string;
};

async function resolveTagToWallet(tag: string): Promise<ResolvedPayRecipient> {
  const normalizedTag = stripTagPrefix(tag);

  if (!normalizedTag || normalizedTag.length < 3) {
    throw new Error("Enter a valid MonoPay tag.");
  }

  const traceId = `pay-resolve-${Date.now().toString(36)}`;
  const { data: tagRows, error: tagError } = await supabase
    .from("monopay_tags")
    .select("tag,wallet_address,status")
    .eq("tag", normalizedTag)
    .limit(2);

  if (tagError) {
    if (isMissingRelationError(tagError)) {
      throw new Error("Username directory is not ready. Run the Supabase identity schema first.");
    }

    throw new Error(tagError.message);
  }

  if (!tagRows || tagRows.length === 0) {
    throw new Error(`No account found for @${normalizedTag}.`);
  }

  if (tagRows.length > 1) {
    console.warn("[pay-flow] resolve:conflict:duplicate-tag", { traceId, normalizedTag, count: tagRows.length });
    throw new Error(`Tag conflict detected for @${normalizedTag}. Contact support.`);
  }

  const tagRow = tagRows[0] as TagLookupRow;

  if (tagRow.status !== "active") {
    throw new Error(`@${normalizedTag} is not available for payments.`);
  }

  const byIdentity = await supabase
    .from("wallet_identities")
    .select("wallet_address,monopay_tag")
    .eq("monopay_tag", normalizedTag)
    .limit(2);

  if (!byIdentity.error && byIdentity.data && byIdentity.data.length > 1) {
    console.warn("[pay-flow] resolve:conflict:duplicate-identity-tag", {
      traceId,
      normalizedTag,
      count: byIdentity.data.length,
    });
    throw new Error(`Tag conflict detected for @${normalizedTag}.`);
  }

  if (!byIdentity.error && byIdentity.data?.length === 1) {
    const identityWallet = assertWalletAddress(byIdentity.data[0].wallet_address, "recipient wallet");
    const tagWallet = assertWalletAddress(tagRow.wallet_address, "recipient wallet");

    if (identityWallet !== tagWallet) {
      console.warn("[pay-flow] resolve:conflict:cross-table-mismatch", {
        traceId,
        normalizedTag,
        tagWallet,
        identityWallet,
      });
      throw new Error(`Tag mapping conflict detected for @${normalizedTag}.`);
    }
  }

  const walletAddress = assertWalletAddress(tagRow.wallet_address, "recipient wallet");
  console.log("[pay-flow] resolve:ok", {
    traceId,
    input: tag,
    normalizedTag,
    walletAddress,
  });

  return {
    input: tag,
    normalized: `@${normalizedTag}`,
    walletAddress,
    source: "tag",
  };
}

async function findProfileByWallet(walletAddress: string): Promise<ProfileLookupRow | null> {
  const profileResult = await supabase
    .from("profiles")
    .select("full_name,email,phone,wallet_address,monopay_tag")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  if (profileResult.error) {
    if (isMissingRelationError(profileResult.error)) {
      return null;
    }

    throw new Error(profileResult.error.message);
  }

  return (profileResult.data as ProfileLookupRow | null) || null;
}

async function findIdentityByWallet(walletAddress: string): Promise<IdentityLookupRow | null> {
  const identityResult = await supabase
    .from("wallet_identities")
    .select("display_name,wallet_address,monopay_tag,metaplex_card_id,metaplex_network")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  if (identityResult.error) {
    if (isMissingRelationError(identityResult.error)) {
      return null;
    }

    throw new Error(identityResult.error.message);
  }

  return (identityResult.data as IdentityLookupRow | null) || null;
}

export async function resolvePayRecipient(input: string): Promise<ResolvedPayRecipient> {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("Recipient is required.");
  }

  if (trimmed.startsWith("@")) {
    return resolveTagToWallet(trimmed);
  }

  const walletAddress = assertWalletAddress(trimmed, "recipient wallet address");
  return {
    input: trimmed,
    normalized: walletAddress,
    walletAddress,
    source: "wallet",
  };
}

export async function searchPayRecipients(input: string, options?: { limit?: number }): Promise<PayRecipientSuggestion[]> {
  const limit = Math.max(1, Math.min(options?.limit ?? 6, 12));
  const trimmed = input.trim();
  const normalized = stripTagPrefix(trimmed);

  if (!trimmed.startsWith("@") || normalized.length < 2) {
    return [];
  }

  const results = new Map<string, PayRecipientSuggestion>();

  const profileQuery = await supabase
    .from("profiles")
    .select("monopay_tag,full_name,wallet_address")
    .ilike("monopay_tag", `${normalized}%`)
    .limit(limit);

  if (!profileQuery.error && Array.isArray(profileQuery.data)) {
    for (const row of profileQuery.data as ProfileLookupRow[]) {
      const tagBase = row.monopay_tag ? stripTagPrefix(row.monopay_tag) : "";
      let wallet = "";

      if (row.wallet_address) {
        try {
          wallet = assertWalletAddress(row.wallet_address, "recipient wallet");
        } catch {
          continue;
        }
      }

      if (!tagBase || !wallet) {
        continue;
      }

      results.set(tagBase, {
        tag: `@${tagBase}`,
        walletAddress: wallet,
        displayName: row.full_name || undefined,
      });
    }
  } else if (profileQuery.error && !isMissingRelationError(profileQuery.error)) {
    throw new Error(profileQuery.error.message);
  }

  const tagQuery = await supabase
    .from("monopay_tags")
    .select("tag,wallet_address,status")
    .ilike("tag", `${normalized}%`)
    .eq("status", "active")
    .limit(limit * 2);

  if (tagQuery.error) {
    if (isMissingRelationError(tagQuery.error)) {
      return Array.from(results.values()).slice(0, limit);
    }

    throw new Error(tagQuery.error.message);
  }

  for (const row of (tagQuery.data || []) as TagLookupRow[]) {
    const tagBase = stripTagPrefix(row.tag);
    let wallet = "";

    try {
      wallet = assertWalletAddress(row.wallet_address, "recipient wallet");
    } catch {
      continue;
    }

    if (!tagBase || results.has(tagBase)) {
      continue;
    }

    results.set(tagBase, {
      tag: `@${tagBase}`,
      walletAddress: wallet,
    });
  }

  return Array.from(results.values())
    .sort((a, b) => {
      const aBase = stripTagPrefix(a.tag);
      const bBase = stripTagPrefix(b.tag);

      if (aBase === normalized && bBase !== normalized) {
        return -1;
      }

      if (bBase === normalized && aBase !== normalized) {
        return 1;
      }

      return aBase.localeCompare(bBase);
    })
    .slice(0, limit);
}

export async function fetchPayRecipientPreview(input: string): Promise<PayRecipientPreview> {
  const resolved = await resolvePayRecipient(input);
  const [profile, identity] = await Promise.all([
    findProfileByWallet(resolved.walletAddress),
    findIdentityByWallet(resolved.walletAddress),
  ]);

  const displayName =
    profile?.full_name?.trim() ||
    identity?.display_name?.trim() ||
    `Wallet ${resolved.walletAddress.slice(0, 4)}...${resolved.walletAddress.slice(-4)}`;
  const profileTag = profile?.monopay_tag ? `@${stripTagPrefix(profile.monopay_tag)}` : undefined;
  const identityTag = identity?.monopay_tag ? `@${stripTagPrefix(identity.monopay_tag)}` : undefined;
  const contact = profile?.phone || profile?.email || undefined;

  return {
    input,
    normalized: resolved.normalized,
    walletAddress: resolved.walletAddress,
    source: resolved.source,
    displayName,
    monopayTag: profileTag || identityTag || (resolved.source === "tag" ? resolved.normalized : undefined),
    contact,
    network: identity?.metaplex_network || undefined,
    metaplexCardId: identity?.metaplex_card_id || undefined,
  };
}
